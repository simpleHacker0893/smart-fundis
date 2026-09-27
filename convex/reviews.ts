import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { canDecide, requireExpert, requireStoredUser } from "./lib/auth";
import { nameLookup, namesFields } from "./lib/assessmentNames";
import {
  type AssessmentStatus,
  assessmentStatusValidator,
  livenessCheckValidator,
  observationValidator,
  reviewDecisionValidator,
  rubricItemValidator,
  verdictValidator,
} from "./lib/validators";

// The Expert queue and decision (#41). Architecture spec §4 (canDecide) and
// §5 (status table: awaiting_review -> approved | reshoot | rejected by an
// eligible Expert; every decision writes a `reviews` and an `auditLog` row).

/** The most rows the queue returns; far above one Expert's day in the MVP. */
const QUEUE_LIMIT = 50;

const queueRowValidator = v.object({
  assessmentId: v.id("assessments"),
  _creationTime: v.number(),
  ...namesFields,
  // The AI's recommendation (never a decision). Present once the AI has run.
  verdict: v.optional(verdictValidator),
  safetyFlagCount: v.number(),
});

/**
 * US-5.1: the `awaiting_review` Assessments an Expert may decide, oldest
 * first (at most 50): only Trades in the caller's approvedTrades, never the
 * caller's own Assessments, never a Demo Fundi's. No video URL and no phone:
 * reviews.detail is the only query that returns the video.
 * Guard: requireExpert (an active Expert, roles derived server-side).
 */
export const queue = query({
  args: {},
  returns: v.array(queueRowValidator),
  handler: async (ctx) => {
    const { user, expert } = await requireExpert(ctx);
    // CONTEXT "Demo Fundi": Demo Assessments never enter an Expert's queue.
    const demo = new Map<Id<"users">, Promise<boolean>>();
    const isDemo = (fundiUserId: Id<"users">) => {
      let known = demo.get(fundiUserId);
      if (known === undefined) {
        known = ctx.db.get("users", fundiUserId).then((u) => u?.isDemo === true);
        demo.set(fundiUserId, known);
      }
      return known;
    };
    // One index range per approved Trade, each already oldest first; merged below.
    const perTrade = await Promise.all(
      expert.approvedTrades.map(async (tradeSlug) => {
        const rows: Doc<"assessments">[] = [];
        const range = ctx.db
          .query("assessments")
          .withIndex("by_status_and_tradeSlug", (q) =>
            q.eq("status", "awaiting_review").eq("tradeSlug", tradeSlug),
          );
        for await (const row of range) {
          if (row.fundiUserId === user._id || (await isDemo(row.fundiUserId))) continue;
          rows.push(row);
          if (rows.length >= QUEUE_LIMIT) break;
        }
        return rows;
      }),
    );
    const merged = perTrade
      .flat()
      .sort((a, b) => a._creationTime - b._creationTime)
      .slice(0, QUEUE_LIMIT);
    const names = nameLookup(ctx);
    return await Promise.all(
      merged.map(async (row) => ({
        assessmentId: row._id,
        _creationTime: row._creationTime,
        ...(await names(row)),
        ...(row.verdict !== undefined ? { verdict: row.verdict } : {}),
        safetyFlagCount: row.safetyFlags?.length ?? 0,
      })),
    );
  },
});

const detailValidator = v.object({
  _id: v.id("assessments"),
  _creationTime: v.number(),
  status: assessmentStatusValidator,
  ...namesFields,
  rubricItems: v.array(rubricItemValidator),
  // The code the Fundi was shown and what the AI read in the video.
  livenessCode: v.string(),
  livenessRead: v.optional(v.string()),
  livenessCheck: v.optional(livenessCheckValidator),
  // The AI result: a recommendation, never a decision.
  observations: v.array(observationValidator),
  verdict: v.optional(verdictValidator),
  confidence: v.optional(v.number()),
  strengths: v.array(v.string()),
  gaps: v.array(v.string()),
  safetyFlags: v.array(v.string()),
  feedbackEn: v.optional(v.string()),
  fallbackModel: v.optional(v.boolean()),
  // Signed URL; null once the video is deleted.
  videoUrl: v.union(v.string(), v.null()),
  videoDeletedAt: v.optional(v.number()),
});

/**
 * One Assessment for an Expert who canDecide on it (spec §4): its Trade,
 * Task and Rubric items, the AI Observations and Verdict, and the signed
 * video URL. The ONLY query in convex/ that returns a video URL (spec §7).
 * Returns null when the Assessment does not exist or the caller may not
 * decide it, so its existence does not leak. No Fundi identity or phone.
 * Guard: requireStoredUser, then canDecide.
 */
export const detail = query({
  args: { assessmentId: v.id("assessments") },
  returns: v.union(detailValidator, v.null()),
  handler: async (ctx, args) => {
    const { user } = await requireStoredUser(ctx);
    const row = await ctx.db.get("assessments", args.assessmentId);
    if (row === null) return null;
    const allowed = await canDecide(ctx, user._id, row);
    if (!allowed.ok) return null;
    const rubric = await ctx.db.get("rubrics", row.rubricId);
    const videoUrl = row.videoStorageId === undefined ? null : await ctx.storage.getUrl(row.videoStorageId);
    return {
      _id: row._id,
      _creationTime: row._creationTime,
      status: row.status,
      ...(await nameLookup(ctx)(row)),
      rubricItems: rubric?.items ?? [],
      livenessCode: row.livenessCode,
      ...(row.livenessRead !== undefined ? { livenessRead: row.livenessRead } : {}),
      ...(row.livenessCheck !== undefined ? { livenessCheck: row.livenessCheck } : {}),
      observations: row.observations ?? [],
      ...(row.verdict !== undefined ? { verdict: row.verdict } : {}),
      ...(row.confidence !== undefined ? { confidence: row.confidence } : {}),
      strengths: row.strengths ?? [],
      gaps: row.gaps ?? [],
      safetyFlags: row.safetyFlags ?? [],
      ...(row.feedbackEn !== undefined ? { feedbackEn: row.feedbackEn } : {}),
      ...(row.fallbackModel !== undefined ? { fallbackModel: row.fallbackModel } : {}),
      videoUrl,
      ...(row.videoDeletedAt !== undefined ? { videoDeletedAt: row.videoDeletedAt } : {}),
    };
  },
});

/** The longest Expert note, after trimming. */
export const NOTE_MAX_LENGTH = 1000;

/** The status each Expert decision moves an `awaiting_review` Assessment to (spec §5). */
const DECISION_STATUS = {
  approve: "approved",
  reshoot: "reshoot",
  reject: "rejected",
} as const satisfies Record<"approve" | "reshoot" | "reject", AssessmentStatus>;

/**
 * US-5.3: an Expert's decision on an `awaiting_review` Assessment: approve,
 * request a reshoot, or reject (spec §5 status table). Approval is what
 * creates the Badge; nothing stores a Badge, it is derived from `approved`.
 *
 * Writes, in one transaction: the new status, one `reviews` row (kind
 * "review", decision, note, deciderUserId, at) and one `auditLog` row
 * (action "review.<decision>", targetTable "assessments", reason = note).
 * The note is trimmed; it is required for reshoot and reject, optional for
 * approve, and at most 1000 characters.
 *
 * Refusals throw a ConvexError `{ code, message }` and write nothing:
 * - `forbidden`: the caller is not an active Expert, or canDecide refuses
 *   (own Assessment, Admins included; Trade not approved; original decider);
 * - `not_found`: no such Assessment;
 * - `invalid_status`: the Assessment is not `awaiting_review` (this includes
 *   a second decision; appeals and Admin overrides are V4);
 * - `note_required`, `note_too_long`.
 * Guard: requireExpert, then canDecide on the stored Assessment.
 */
export const decide = mutation({
  args: {
    assessmentId: v.id("assessments"),
    decision: reviewDecisionValidator,
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user } = await requireExpert(ctx);
    const row = await ctx.db.get("assessments", args.assessmentId);
    if (row === null) {
      throw new ConvexError({ code: "not_found", message: "No such Assessment." });
    }
    const allowed = await canDecide(ctx, user._id, row);
    if (!allowed.ok) {
      throw new ConvexError({
        code: "forbidden",
        message: `You may not decide this Assessment (${allowed.code}).`,
      });
    }
    if (row.status !== "awaiting_review") {
      throw new ConvexError({
        code: "invalid_status",
        message: `Only an Assessment awaiting review can be decided; this one is ${row.status}.`,
      });
    }
    const note = args.note?.trim() ?? "";
    if (note === "" && args.decision !== "approve") {
      throw new ConvexError({
        code: "note_required",
        message: "A note is required to request a reshoot or to reject.",
      });
    }
    if (note.length > NOTE_MAX_LENGTH) {
      throw new ConvexError({
        code: "note_too_long",
        message: `The note is longer than ${NOTE_MAX_LENGTH} characters.`,
      });
    }

    const at = Date.now();
    await ctx.db.patch("assessments", row._id, { status: DECISION_STATUS[args.decision] });
    await ctx.db.insert("reviews", {
      assessmentId: row._id,
      deciderUserId: user._id,
      kind: "review",
      decision: args.decision,
      ...(note !== "" ? { note } : {}),
      at,
    });
    await ctx.db.insert("auditLog", {
      actorUserId: user._id,
      action: `review.${args.decision}`,
      targetTable: "assessments",
      targetId: row._id,
      ...(note !== "" ? { reason: note } : {}),
      at,
    });
    return null;
  },
});
