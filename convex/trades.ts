import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { tradeOrder } from "./lib/trades";
import { tradeCategoryValidator } from "./lib/validators";

/** Far above the 62 catalogue Trades; keeps the read bounded. */
const MAX_TRADES = 200;

/**
 * The Trades for the onboarding picker, in catalogue order (TRADE_CATALOGUE).
 * A Trade that is not in the catalogue comes after them, by slug.
 * `category` lets the web group the picker by category. `verifyNow` is true
 * when the Trade has an active Rubric (spec §5 derived values).
 * Guard: any signed-in User.
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      category: tradeCategoryValidator,
      verifyNow: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    await requireUser(ctx);
    // by_slug keeps the unlisted Trades sorted by slug; sort() is stable.
    const trades = await ctx.db.query("trades").withIndex("by_slug").take(MAX_TRADES);
    return trades
      .sort((a, b) => tradeOrder(a.slug) - tradeOrder(b.slug))
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        category: t.category,
        verifyNow: t.activeRubricId !== undefined,
      }));
  },
});
