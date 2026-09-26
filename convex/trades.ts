import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { tradeOrder } from "./lib/trades";

/** Far above the 12 Trades; keeps the read bounded. */
const MAX_TRADES = 100;

/**
 * The Trades for the onboarding picker, in the order of MVP_TRADES (which is
 * the order of web/lib/trades.ts). A Trade that is not in MVP_TRADES comes
 * after them, by slug. `verifyNow` is true when the Trade has an active
 * Rubric (spec §5 derived values).
 * Guard: any signed-in User.
 */
export const list = query({
  args: {},
  returns: v.array(v.object({ slug: v.string(), name: v.string(), verifyNow: v.boolean() })),
  handler: async (ctx) => {
    await requireUser(ctx);
    // by_slug keeps the unlisted Trades sorted by slug; sort() is stable.
    const trades = await ctx.db.query("trades").withIndex("by_slug").take(MAX_TRADES);
    return trades
      .sort((a, b) => tradeOrder(a.slug) - tradeOrder(b.slug))
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        verifyNow: t.activeRubricId !== undefined,
      }));
  },
});
