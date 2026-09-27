import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type { AssessmentStatus } from "./validators";

/** The statuses an Expert decision leaves, with its reviews row. */
const DECIDED: ReadonlySet<AssessmentStatus> = new Set(["approved", "reshoot", "rejected"]);

/**
 * The decision that set a decided Assessment's status: its latest reviews
 * row. Null when nothing decided it (an AI guard reshoot has no row).
 * Shared by assessments.listMine (`decidedAt`) and fundiProfiles.getPublic
 * (the Badge date), so both show the same decision date.
 */
export async function latestDecision(ctx: QueryCtx, row: Doc<"assessments">): Promise<Doc<"reviews"> | null> {
  if (!DECIDED.has(row.status)) return null;
  return await ctx.db
    .query("reviews")
    .withIndex("by_assessmentId", (q) => q.eq("assessmentId", row._id))
    .order("desc")
    .first();
}
