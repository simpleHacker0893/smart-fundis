import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { isContactRole, normalizeContact, validateContact } from "./lib/contact";

const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const THROTTLE_MAX = 3;

/**
 * The /contact form (#29). Public and unauthenticated by design: clients have
 * no account in the MVP (D-2). It only ever writes, and returns `{ ok: true }`;
 * there is deliberately no query that reads contactMessages. Admins read them
 * in the Convex dashboard until the V4 Admin UI.
 *
 * Errors are generic ConvexErrors ("invalid" or "throttled") that name no
 * field and echo nothing back; the web form shows field errors itself using
 * the same rules from lib/contact.ts.
 */
export const send = mutation({
  args: {
    name: v.string(),
    contact: v.string(),
    role: v.string(),
    topic: v.string(),
    message: v.string(),
    // Honeypot: hidden from people, so anything in it means a bot.
    website: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    if (args.website && args.website.trim() !== "") {
      // Drop silently, so a bot learns nothing.
      return { ok: true as const };
    }

    const errors = validateContact(args);
    const contact = normalizeContact(args.contact);
    if (Object.keys(errors).length > 0 || contact === null || !isContactRole(args.role)) {
      throw new ConvexError({
        code: "invalid",
        message: "Your message could not be sent. Check the fields and try again.",
      });
    }

    const now = Date.now();
    const recent = await ctx.db
      .query("contactMessages")
      .withIndex("by_contact_and_createdAt", (q) =>
        q.eq("contact", contact).gt("createdAt", now - THROTTLE_WINDOW_MS),
      )
      .take(THROTTLE_MAX);
    if (recent.length >= THROTTLE_MAX) {
      throw new ConvexError({
        code: "throttled",
        message: "Too many messages from this contact. Try again in a few minutes.",
      });
    }

    await ctx.db.insert("contactMessages", {
      name: args.name.trim(),
      contact,
      role: args.role,
      topic: args.topic.trim(),
      message: args.message.trim(),
      createdAt: now,
      status: "new",
    });
    return { ok: true as const };
  },
});
