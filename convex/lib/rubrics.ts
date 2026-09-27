import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * The Trade's live Rubric: the one `trade.activeRubricId` points at, when it
 * exists and its status is `active`. Null otherwise, so the Trade is not
 * "Verify now" (spec §5 derived values). The one place that follows
 * activeRubricId; trades.uploadPicker and assessments.create both use it.
 */
export async function getActiveRubric(
  ctx: QueryCtx,
  trade: Doc<"trades">,
): Promise<Doc<"rubrics"> | null> {
  if (trade.activeRubricId === undefined) return null;
  const rubric = await ctx.db.get("rubrics", trade.activeRubricId);
  return rubric !== null && rubric.status === "active" ? rubric : null;
}
