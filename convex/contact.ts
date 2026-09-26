import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  cleanLine,
  cleanMessage,
  contactKey,
  contactRoleValidator,
  exceedsRawCaps,
  normalizeContact,
  validateContact,
} from "./lib/contact";
import { rateLimiter } from "./lib/rateLimiter";

const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const THROTTLE_MAX = 3;

// The one refusal for invalid input, the per-contact throttle and the global
// cap alike, so a caller cannot tell them apart (no oracle, and nobody can
// find out whether someone else's contact is being throttled).
const REFUSED = "Your message could not be sent right now. Try again later, or email info@smartfundis.com.";

function refuse(): never {
  throw new ConvexError({ code: "refused", message: REFUSED });
}

/**
 * The /contact form (#29). Public and unauthenticated by design: clients have
 * no account in the MVP (D-2). It only ever writes, and returns `{ ok: true }`;
 * there is deliberately no query that reads contactMessages. Admins read them
 * in the Convex dashboard until the V4 Admin UI.
 *
 * Order: honeypot, raw size caps (before any parsing), validation, the
 * per-contact throttle (3 in 10 minutes, keyed by contactKey), then the
 * global cap (30 an hour). Any refusal throws, which rolls back the whole
 * transaction, so refused messages never spend the global budget.
 */
export const send = mutation({
  args: {
    name: v.string(),
    contact: v.string(),
    role: contactRoleValidator,
    topic: v.string(),
    message: v.string(),
    // Honeypot: hidden from people, so anything in it means a bot.
    website: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    if (args.website !== undefined && args.website.trim() !== "") {
      // Drop silently, so a bot learns nothing.
      return { ok: true as const };
    }
    if (exceedsRawCaps(args)) refuse();

    const contact = normalizeContact(args.contact);
    const key = contactKey(args.contact);
    if (Object.keys(validateContact(args)).length > 0 || contact === null || key === null) refuse();

    const now = Date.now();
    const recent = await ctx.db
      .query("contactMessages")
      .withIndex("by_contactKey_and_createdAt", (q) =>
        q.eq("contactKey", key).gt("createdAt", now - THROTTLE_WINDOW_MS),
      )
      .take(THROTTLE_MAX);
    if (recent.length >= THROTTLE_MAX) refuse();

    const global = await rateLimiter.limit(ctx, "contactGlobal");
    if (!global.ok) refuse();

    await ctx.db.insert("contactMessages", {
      name: cleanLine(args.name),
      contact,
      contactKey: key,
      role: args.role,
      topic: cleanLine(args.topic),
      message: cleanMessage(args.message),
      createdAt: now,
      status: "new",
    });
    return { ok: true as const };
  },
});
