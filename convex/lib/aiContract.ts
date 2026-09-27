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

/**
 * ADR-11, re-applied on the server so a worker bug can't publish a clean pass.
 * It can lower a Verdict, never raise it:
 * - liveness is `yes` only when the worker says so AND the digits it read are
 *   the stored Liveness code;
 * - a safety item whose Observation is `no`, `unclear` or missing is flagged;
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
  const results = new Map(input.observations.map((o) => [o.itemId, o.result]));
  const flags = new Set(input.safetyFlags);
  for (const item of input.items) {
    if (item.safety && results.get(item.id) !== "yes") {
      flags.add(item.id);
    }
  }
  const safetyFlags = [...flags];
  const capped = input.verdict === "pass" && (livenessCheck !== "yes" || safetyFlags.length > 0);
  return { verdict: capped ? "needs_review" : input.verdict, livenessCheck, safetyFlags };
}
