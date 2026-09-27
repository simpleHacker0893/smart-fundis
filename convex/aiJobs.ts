import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { CLAIM_SCAN, jobValidator, type Job } from "./lib/aiContract";

// The state changes behind /ai/claim and /ai/callback, and the stuck-job cron
// (spec §3, §5 status table, §6). Each is one transaction. convex/http.ts does
// the transport: secret, body shape, status codes.

/**
 * Moves the oldest `queued` Assessment to `analyzing` (attempts + 1) and
 * returns its job, or null when nothing is queued. Atomic: two pollers can't
 * claim the same row, because Convex retries a conflicting transaction.
 * A queued row whose video, Rubric or Trade is gone can't be analysed; it is
 * marked `failed` (a system error) so it doesn't block the queue.
 */
export const claim = internalMutation({
  args: { workerId: v.string() },
  returns: v.union(v.null(), jobValidator),
  handler: async (ctx, { workerId }) => {
    const now = Date.now();
    const oldest = await ctx.db
      .query("assessments")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .take(CLAIM_SCAN);
    for (const row of oldest) {
      const attempt = row.attempts + 1;
      const claimed = { attempts: attempt, claimedAt: now, claimedBy: workerId };
      const job = await buildJob(ctx, row, attempt);
      if (job === null) {
        await ctx.db.patch("assessments", row._id, { ...claimed, status: "failed" });
        console.warn(`ai claim: Assessment ${row._id} failed, its video, Rubric or Trade is missing`);
        continue;
      }
      await ctx.db.patch("assessments", row._id, { ...claimed, status: "analyzing" });
      return job;
    }
    return null;
  },
});

/** The §6 job for a row, or null when something it needs is gone. Never logs the URL. */
async function buildJob(ctx: MutationCtx, row: Doc<"assessments">, attempt: number): Promise<Job | null> {
  if (row.videoStorageId === undefined) {
    return null;
  }
  const videoUrl = await ctx.storage.getUrl(row.videoStorageId);
  const rubric = await ctx.db.get("rubrics", row.rubricId);
  const trade = await ctx.db
    .query("trades")
    .withIndex("by_slug", (q) => q.eq("slug", row.tradeSlug))
    .unique();
  if (videoUrl === null || rubric === null || trade === null) {
    return null;
  }
  return {
    assessmentId: row._id,
    attempt,
    videoUrl,
    trade: { slug: trade.slug, name: trade.name },
    task: { slug: rubric.taskSlug, name: rubric.taskName },
    rubric: { id: rubric._id, version: rubric.version, items: rubric.items },
    livenessCode: row.livenessCode,
  };
}
