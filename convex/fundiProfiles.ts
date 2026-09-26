import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getFundiProfile, requireStoredUser } from "./lib/auth";
import { cleanTradeSlugs, parseFundiProfile, type FundiProfileErrors } from "./lib/fundiProfile";

/**
 * The minimal onboarding form (#37): name, phone, one or more of the 12
 * Trades (operator change on #37, D-24) and county. A Trade need not be
 * "Verify now" to be declared. Creating the profile makes the caller a Fundi
 * (ADR-18).
 *
 * Guard: a signed-in User whose users row exists (users.store has run). Who
 * the profile belongs to comes only from the token; there is no userId arg.
 *
 * Errors (ConvexError data):
 * - `{ code: "no_user" }`: users.store has not run yet;
 * - `{ code: "already_exists" }`: the caller already has a Fundi profile;
 * - `{ code: "invalid", fields }`: field codes from FundiProfileErrors;
 *   `fields.tradeSlugs` is "required" (none chosen) or "unknown" (a slug not
 *   in `trades`, or more than 12).
 */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    tradeSlugs: v.array(v.string()),
    county: v.string(),
  },
  returns: v.id("fundiProfiles"),
  handler: async (ctx, args) => {
    const { user } = await requireStoredUser(ctx);

    if ((await getFundiProfile(ctx, user._id)) !== null) {
      throw new ConvexError({ code: "already_exists", message: "You already have a Fundi profile." });
    }

    const parsed = parseFundiProfile(args);
    const fields: FundiProfileErrors = parsed.ok ? {} : { ...parsed.errors };
    if (!fields.tradeSlugs) {
      // Checked even when another field failed, so every error shows at once.
      // At most FUNDI_PROFILE_LIMITS.tradesMax indexed reads.
      for (const slug of cleanTradeSlugs(args.tradeSlugs) ?? []) {
        const trade = await ctx.db
          .query("trades")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        if (trade === null) {
          fields.tradeSlugs = "unknown";
          break;
        }
      }
    }
    if (!parsed.ok || Object.keys(fields).length > 0) {
      throw new ConvexError({ code: "invalid", fields });
    }

    const { name, phone, tradeSlugs, county } = parsed.value;
    await ctx.db.patch("users", user._id, { name, phone, county });
    return await ctx.db.insert("fundiProfiles", {
      userId: user._id,
      trades: tradeSlugs,
      county,
      publicListing: true,
    });
  },
});
