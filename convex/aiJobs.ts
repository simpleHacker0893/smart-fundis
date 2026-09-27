import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { applyHardRules, callbackBodyValidator, CLAIM_SCAN, CLAIM_TIMEOUT_MS, jobValidator, MAX_ATTEMPTS, type Job } from "./lib/aiContract";
import { assessmentStatusValidator } from "./lib/validators";

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

const callbackResultValidator = v.union(
  v.object({ ok: v.literal(true), status: assessmentStatusValidator }),
  v.object({ ok: v.literal(false), reason: v.union(v.literal("stale"), v.literal("unknown_item")) }),
);

/**
 * Applies a worker's outcome. Accepted only while the Assessment is
 * `analyzing` with the same `attempt`; anything else is `stale` (HTTP 409)
 * and writes nothing: two pollers, a callback after a requeue, a deleted
 * Assessment, or an id that isn't an Assessment.
 * - result  → awaiting_review, after the ADR-11 hard rules (applyHardRules);
 * - reshoot → reshoot, with the guard's reason; the next video is a new Assessment;
 * - error   → queued while attempts < MAX_ATTEMPTS, else failed.
 */
export const callback = internalMutation({
  args: { body: callbackBodyValidator },
  returns: callbackResultValidator,
  handler: async (ctx, { body }) => {
    const id = ctx.db.normalizeId("assessments", body.assessmentId);
    const row = id === null ? null : await ctx.db.get("assessments", id);
    if (row === null || row.status !== "analyzing" || row.attempts !== body.attempt) {
      return { ok: false as const, reason: "stale" as const };
    }

    switch (body.outcome) {
      case "result": {
        const rubric = await ctx.db.get("rubrics", row.rubricId);
        if (rubric === null) {
          throw new Error(`Assessment ${row._id} points at a missing Rubric`);
        }
        const known = new Set(rubric.items.map((item) => item.id));
        if (body.observations.some((o) => !known.has(o.itemId))) {
          return { ok: false as const, reason: "unknown_item" as const };
        }
        const ruled = applyHardRules({
          items: rubric.items,
          livenessCode: row.livenessCode,
          observations: body.observations,
          liveness: body.liveness,
          verdict: body.verdict.verdict,
          safetyFlags: body.safetyFlags,
        });
        await ctx.db.patch("assessments", row._id, {
          status: "awaiting_review",
          observations: body.observations,
          livenessRead: body.liveness.read ?? undefined,
          livenessCheck: ruled.livenessCheck,
          verdict: ruled.verdict,
          confidence: body.verdict.confidence,
          strengths: body.verdict.strengths,
          gaps: body.verdict.gaps,
          safetyFlags: ruled.safetyFlags,
          feedbackEn: body.verdict.feedbackEn,
          feedbackSw: body.verdict.feedbackSw,
          model: body.model,
          latencyMs: body.latencyMs,
          fallbackModel: body.fallbackModel,
        });
        return { ok: true as const, status: "awaiting_review" as const };
      }
      case "reshoot": {
        await ctx.db.patch("assessments", row._id, { status: "reshoot", reshootReason: body.reason });
        return { ok: true as const, status: "reshoot" as const };
      }
      case "error": {
        const status = row.attempts < MAX_ATTEMPTS ? ("queued" as const) : ("failed" as const);
        await ctx.db.patch("assessments", row._id, {
          status,
          ...(status === "queued" ? { claimedAt: undefined, claimedBy: undefined } : {}),
        });
        console.warn(`ai callback: Assessment ${row._id} attempt ${row.attempts} error "${body.errorCode.slice(0, 64)}" → ${status}`);
        return { ok: true as const, status };
      }
    }
  },
});

/** Rows one cron run handles; the next minute's run takes the rest. */
const REQUEUE_BATCH = 100;

/**
 * The stuck-job cron (spec §3): an Assessment `analyzing` for longer than
 * CLAIM_TIMEOUT_MS goes back to `queued`, or to `failed` once its attempts
 * reach MAX_ATTEMPTS. The worker's late callback then gets 409.
 */
export const requeueStale = internalMutation({
  args: {},
  returns: v.object({ requeued: v.number(), failed: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - CLAIM_TIMEOUT_MS;
    const stuck = await ctx.db
      .query("assessments")
      .withIndex("by_status_and_claimedAt", (q) => q.eq("status", "analyzing").lt("claimedAt", cutoff))
      .take(REQUEUE_BATCH);
    let requeued = 0;
    let failed = 0;
    for (const row of stuck) {
      if (row.attempts >= MAX_ATTEMPTS) {
        await ctx.db.patch("assessments", row._id, { status: "failed" });
        failed++;
      } else {
        await ctx.db.patch("assessments", row._id, { status: "queued", claimedAt: undefined, claimedBy: undefined });
        requeued++;
      }
    }
    if (stuck.length > 0) {
      console.warn(`ai requeueStale: ${requeued} requeued, ${failed} failed`);
    }
    return { requeued, failed };
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
