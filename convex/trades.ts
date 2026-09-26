import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireFundi, requireUser } from "./lib/auth";
import { tradeOrder } from "./lib/tradeCatalogue";
import { taskNeedsClientConsent } from "./lib/trades";
import { rubricItemValidator, tradeCategoryValidator } from "./lib/validators";

/** Far above the 62 catalogue Trades; keeps the read bounded. */
const MAX_TRADES = 200;

/**
 * The Trades for the onboarding picker, in catalogue order (lib/tradeCatalogue.ts).
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

/**
 * The upload picker (#38, US-3.2): Verify-now Trades only (those with an
 * active Rubric), in catalogue order, each with its Task and the Rubric
 * checklist in plain words. `onProfile` is true for a Trade the Fundi
 * declared; any Verify-now Trade may still be picked. `clientOnCamera` says
 * whether the upload needs the "The client agreed to be filmed" tick. Item
 * `text` is the English Rubric text; the web may show en.json copy keyed by
 * item id instead. Recording tips are web copy (en.json), not Rubric data.
 * Guard: requireFundi.
 */
export const uploadPicker = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      onProfile: v.boolean(),
      tasks: v.array(
        v.object({
          slug: v.string(),
          name: v.string(),
          rubricVersion: v.number(),
          clientOnCamera: v.boolean(),
          items: v.array(rubricItemValidator),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const { profile } = await requireFundi(ctx);
    const trades = await ctx.db.query("trades").withIndex("by_slug").take(MAX_TRADES);
    const picker = [];
    for (const trade of trades.sort((a, b) => tradeOrder(a.slug) - tradeOrder(b.slug))) {
      if (trade.activeRubricId === undefined) continue;
      const rubric = await ctx.db.get("rubrics", trade.activeRubricId);
      if (rubric === null || rubric.status !== "active") continue;
      picker.push({
        slug: trade.slug,
        name: trade.name,
        onProfile: profile.trades.includes(trade.slug),
        tasks: [
          {
            slug: rubric.taskSlug,
            name: rubric.taskName,
            rubricVersion: rubric.version,
            clientOnCamera: taskNeedsClientConsent(trade.slug, rubric.taskSlug),
            items: rubric.items,
          },
        ],
      });
    }
    return picker;
  },
});
