import { v, type Infer } from "convex/values";

// Shared validators for the V1 tables (architecture spec §5). The schema and
// the functions both import these, so a status or a Rubric item has one shape.

/** `trades.category`: an internal grouping, never shown to Clients as "category". */
export const tradeCategoryValidator = v.union(
  v.literal("skilled"),
  v.literal("semi_skilled"),
  v.literal("odd_job"),
);

/** One Rubric item: a single observable step, `safety` when a mistake can hurt someone. */
export type TradeCategory = Infer<typeof tradeCategoryValidator>;

export const rubricItemValidator = v.object({
  id: v.string(),
  text: v.string(),
  safety: v.boolean(),
});
export type RubricItem = Infer<typeof rubricItemValidator>;

export const rubricStatusValidator = v.union(v.literal("active"), v.literal("retired"));

/** The Assessment statuses (spec §5 status table). */
export const assessmentStatusValidator = v.union(
  v.literal("queued"),
  v.literal("analyzing"),
  v.literal("awaiting_review"),
  v.literal("approved"),
  v.literal("reshoot"),
  v.literal("rejected"),
  v.literal("appealed"),
  v.literal("failed"),
);
export type AssessmentStatus = Infer<typeof assessmentStatusValidator>;

/** An AI Observation for one Rubric item. */
export const observationValidator = v.object({
  itemId: v.string(),
  result: v.union(v.literal("yes"), v.literal("no"), v.literal("unclear")),
  evidence: v.string(),
  timestampS: v.number(),
});

export const verdictValidator = v.union(
  v.literal("pass"),
  v.literal("needs_review"),
  v.literal("fail"),
);

export const livenessCheckValidator = v.union(v.literal("yes"), v.literal("unclear"));

/** Why the video-quality guard asked for a new video (spec §6 `reshoot` callback). */
export const reshootReasonValidator = v.object({
  code: v.union(
    v.literal("too_short"),
    v.literal("too_long"),
    v.literal("low_res"),
    v.literal("too_dark"),
  ),
  en: v.string(),
  sw: v.string(),
});

export const reviewKindValidator = v.union(
  v.literal("review"),
  v.literal("appeal"),
  v.literal("override"),
);

export const reviewDecisionValidator = v.union(
  v.literal("approve"),
  v.literal("reshoot"),
  v.literal("reject"),
);
