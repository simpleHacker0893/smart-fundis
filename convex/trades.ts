import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/** Far above the MVP's two Trades; keeps the read bounded. */
const MAX_TRADES = 100;

/**
 * The Trades for the onboarding picker, sorted by slug. `verifyNow` is true
 * when the Trade has an active Rubric (spec §5 derived values).
 * Guard: any signed-in User.
 */
export const list = query({
  args: {},
  returns: v.array(v.object({ slug: v.string(), name: v.string(), verifyNow: v.boolean() })),
  handler: async (ctx) => {
    await requireUser(ctx);
    const trades = await ctx.db.query("trades").withIndex("by_slug").take(MAX_TRADES);
    return trades.map((t) => ({
      slug: t.slug,
      name: t.name,
      verifyNow: t.activeRubricId !== undefined,
    }));
  },
});
