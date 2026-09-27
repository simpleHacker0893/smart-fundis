import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/** The Trade and Task names of an Assessment (English; the web translates by slug). */
export type Names = { tradeSlug: string; tradeName: string; taskSlug: string; taskName: string };

export const namesFields = {
  tradeSlug: v.string(),
  tradeName: v.string(),
  taskSlug: v.string(),
  taskName: v.string(),
};

/** Looks up names once per Trade and Rubric, however many Assessments share them. */
export function nameLookup(ctx: QueryCtx) {
  const trades = new Map<string, Promise<string>>();
  const rubrics = new Map<Id<"rubrics">, Promise<{ taskSlug: string; taskName: string }>>();
  return async (row: Doc<"assessments">): Promise<Names> => {
    let tradeName = trades.get(row.tradeSlug);
    if (tradeName === undefined) {
      tradeName = ctx.db
        .query("trades")
        .withIndex("by_slug", (q) => q.eq("slug", row.tradeSlug))
        .unique()
        .then((trade) => trade?.name ?? row.tradeSlug);
      trades.set(row.tradeSlug, tradeName);
    }
    let task = rubrics.get(row.rubricId);
    if (task === undefined) {
      task = ctx.db
        .get("rubrics", row.rubricId)
        .then((rubric) => ({ taskSlug: rubric?.taskSlug ?? "", taskName: rubric?.taskName ?? "" }));
      rubrics.set(row.rubricId, task);
    }
    return { tradeSlug: row.tradeSlug, tradeName: await tradeName, ...(await task) };
  };
}
