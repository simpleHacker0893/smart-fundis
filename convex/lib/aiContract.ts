import { v, type Infer } from "convex/values";
import {
  livenessCheckValidator,
  observationValidator,
  reshootReasonValidator,
  rubricItemValidator,
  verdictValidator,
  type LivenessCheck,
  type Observation,
  type RubricItem,
  type Verdict,
} from "./validators";

/** F4 caps on a worker's `result` and `error` callback, so no field can grow past what a legitimate worker sends. */
export const MAX_LIST_ITEMS = 20;
export const MAX_TEXT_LENGTH = 2000;
export const MAX_MODEL_LENGTH = 200;
export const MAX_ERROR_CODE_LENGTH = 200;

// The pull-model AI contract (spec §6, ADR-9): shapes, limits and the hard
// rules Convex re-applies to every result.

/** An `analyzing` Assessment claimed longer ago than this is stuck (spec §3). */
export const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;
/** At this many attempts an error or a stuck job becomes `failed`. */
export const MAX_ATTEMPTS = 2;
export const MAX_WORKER_ID_LENGTH = 100;
/** How many `queued` rows one claim looks at before giving up (see aiJobs.claim). */
export const CLAIM_SCAN = 5;

export const claimBodyValidator = v.object({ workerId: v.string() });
export type ClaimBody = Infer<typeof claimBodyValidator>;

/** The 200 body of /ai/claim. `livenessCode` goes to the rules node only (ADR-19). */
export const jobValidator = v.object({
  assessmentId: v.id("assessments"),
  attempt: v.number(),
  videoUrl: v.string(),
  trade: v.object({ slug: v.string(), name: v.string() }),
  task: v.object({ slug: v.string(), name: v.string() }),
  rubric: v.object({ id: v.id("rubrics"), version: v.number(), items: v.array(rubricItemValidator) }),
  livenessCode: v.string(),
});
export type Job = Infer<typeof jobValidator>;

// assessmentId is a plain string: the mutation normalizes it, so a garbage or
// foreign id is a 409 (no such Assessment), not a validation 400.
const target = { assessmentId: v.string(), attempt: v.number() };

export const callbackBodyValidator = v.union(
  v.object({
    ...target,
    outcome: v.literal("result"),
    observations: v.array(observationValidator),
    liveness: v.object({ read: v.union(v.string(), v.null()), check: livenessCheckValidator }),
    verdict: v.object({
      verdict: verdictValidator,
      confidence: v.number(),
      strengths: v.array(v.string()),
      gaps: v.array(v.string()),
      feedbackEn: v.string(),
      // Optional: English only for now (D-64).
      feedbackSw: v.optional(v.string()),
    }),
    safetyFlags: v.array(v.string()),
    model: v.string(),
    fallbackModel: v.boolean(),
    latencyMs: v.number(),
  }),
  v.object({ ...target, outcome: v.literal("reshoot"), reason: reshootReasonValidator }),
  v.object({ ...target, outcome: v.literal("error"), errorCode: v.string() }),
);
export type CallbackBody = Infer<typeof callbackBodyValidator>;
/** The `result` branch of a callback body, before it is stored (aiJobs.callback). */
export type ResultCallbackBody = Extract<CallbackBody, { outcome: "result" }>;

/**
 * ADR-11, re-applied on the server so a worker bug can't publish a clean pass.
 * It can lower a Verdict, never raise it:
 * - liveness is `yes` only when the worker says so AND the digits it read are
 *   the stored Liveness code;
 * - a safety item is flagged unless it has at least one Observation AND every
 *   Observation for it is `yes` (F1: a duplicate itemId can't hide a `no`);
 * - a `pass` with liveness not `yes` or any flag becomes `needs_review`.
 */
export function applyHardRules(input: {
  items: RubricItem[];
  livenessCode: string;
  observations: Observation[];
  liveness: { read: string | null; check: LivenessCheck };
  verdict: Verdict;
  safetyFlags: string[];
}): { verdict: Verdict; livenessCheck: LivenessCheck; safetyFlags: string[] } {
  const livenessCheck: LivenessCheck =
    input.liveness.check === "yes" && input.liveness.read === input.livenessCode ? "yes" : "unclear";
  const flags = new Set(input.safetyFlags);
  for (const item of input.items) {
    if (!item.safety) {
      continue;
    }
    const own = input.observations.filter((o) => o.itemId === item.id);
    if (own.length === 0 || own.some((o) => o.result !== "yes")) {
      flags.add(item.id);
    }
  }
  const safetyFlags = [...flags];
  const capped = input.verdict === "pass" && (livenessCheck !== "yes" || safetyFlags.length > 0);
  return { verdict: capped ? "needs_review" : input.verdict, livenessCheck, safetyFlags };
}

/** F1: true when the same Rubric item id appears more than once in a worker's Observations. */
export function hasDuplicateItemId(observations: Observation[]): boolean {
  const seen = new Set<string>();
  for (const observation of observations) {
    if (seen.has(observation.itemId)) {
      return true;
    }
    seen.add(observation.itemId);
  }
  return false;
}

/**
 * §6 rule 2: "A Rubric item with no Observation is set to unclear". Adds one
 * for every Rubric item the worker's Observations don't cover, so
 * applyHardRules and the stored result always have one row per item. Called
 * only after `observations` is known to hold no unknown or duplicate itemId.
 */
export function fillMissingObservations(items: RubricItem[], observations: Observation[]): Observation[] {
  const present = new Set(observations.map((o) => o.itemId));
  const missing: Observation[] = items
    .filter((item) => !present.has(item.id))
    .map((item) => ({ itemId: item.id, result: "unclear" as const, evidence: "", timestampS: 0 }));
  return [...observations, ...missing];
}

/**
 * F4: the size and range caps on a `result` callback that Convex's validators
 * don't express (a finite number's range, an array's length, a string's
 * length, a safetyFlags id being one of the Rubric's). timestampS vs the
 * video's length is not checkable here (Convex stores no duration); that stays
 * rules.py's job.
 */
export function resultInBounds(body: ResultCallbackBody, knownItemIds: Set<string>): boolean {
  const { verdict, observations, safetyFlags, model, latencyMs } = body;
  if (verdict.confidence < 0 || verdict.confidence > 1) {
    return false;
  }
  if (latencyMs < 0) {
    return false;
  }
  if (observations.some((o) => o.timestampS < 0 || o.evidence.length > MAX_TEXT_LENGTH)) {
    return false;
  }
  if (
    verdict.strengths.length > MAX_LIST_ITEMS ||
    verdict.gaps.length > MAX_LIST_ITEMS ||
    safetyFlags.length > MAX_LIST_ITEMS
  ) {
    return false;
  }
  if (verdict.feedbackEn.length > MAX_TEXT_LENGTH) {
    return false;
  }
  if (verdict.feedbackSw !== undefined && verdict.feedbackSw.length > MAX_TEXT_LENGTH) {
    return false;
  }
  if (model.length > MAX_MODEL_LENGTH) {
    return false;
  }
  if (safetyFlags.some((itemId) => !knownItemIds.has(itemId))) {
    return false;
  }
  return true;
}

/** F4: the errorCode cap on an `error` callback. */
export function errorCodeInBounds(errorCode: string): boolean {
  return errorCode.length <= MAX_ERROR_CODE_LENGTH;
}
