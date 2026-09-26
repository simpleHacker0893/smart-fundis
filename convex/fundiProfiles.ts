import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getFundiProfile, requireStoredUser } from "./lib/auth";
import { parseFundiProfile, type FundiProfileErrors } from "./lib/fundiProfile";

/**
 * The minimal onboarding form (#37, spec #36 decision 2): name, phone, one
 * Trade and county. Creating the profile makes the caller a Fundi (ADR-18).
 *
 * Guard: a signed-in User whose users row exists (users.store has run). Who
 * the profile belongs to comes only from the token; there is no userId arg.
 *
 * Errors (ConvexError data):
 * - `{ code: "no_user" }`: users.store has not run yet;
 * - `{ code: "already_exists" }`: the caller already has a Fundi profile;
 * - `{ code: "invalid", fields }`: field codes from FundiProfileErrors.
 */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    tradeSlug: v.string(),
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
    if (!fields.tradeSlug) {
      const trade = await ctx.db
        .query("trades")
        .withIndex("by_slug", (q) => q.eq("slug", args.tradeSlug.trim()))
        .unique();
      if (trade === null) fields.tradeSlug = "unknown";
    }
    if (!parsed.ok || Object.keys(fields).length > 0) {
      throw new ConvexError({ code: "invalid", fields });
    }

    const { name, phone, tradeSlug, county } = parsed.value;
    await ctx.db.patch("users", user._id, { name, phone, county });
    return await ctx.db.insert("fundiProfiles", {
      userId: user._id,
      trades: [tradeSlug],
      county,
      publicListing: true,
    });
  },
});
