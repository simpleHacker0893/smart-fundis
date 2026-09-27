import { describe, expect, it } from "vitest";
import {
  applyHardRules,
  errorCodeInBounds,
  fillMissingObservations,
  hasDuplicateItemId,
  MAX_ERROR_CODE_LENGTH,
  MAX_LIST_ITEMS,
  MAX_MODEL_LENGTH,
  MAX_TEXT_LENGTH,
  resultInBounds,
  type ResultCallbackBody,
} from "./aiContract";
import type { Observation, RubricItem } from "./validators";

const ITEMS = [
  { id: "isolate", text: "Isolates the circuit", safety: true },
  { id: "strip", text: "Strips the wires", safety: false },
];
const yes = (itemId: string): Observation => ({ itemId, result: "yes", evidence: "seen", timestampS: 1 });
const base = {
  items: ITEMS,
  livenessCode: "482",
  observations: [yes("isolate"), yes("strip")],
  liveness: { read: "482" as string | null, check: "yes" as const },
  verdict: "pass" as const,
  safetyFlags: [] as string[],
};

describe("applyHardRules (ADR-11, spec §6 rules)", () => {
  it("keeps a clean pass", () => {
    expect(applyHardRules(base)).toEqual({ verdict: "pass", livenessCheck: "yes", safetyFlags: [] });
  });
  it.each(["no", "unclear"] as const)("caps pass when a safety item is %s", (result) => {
    const out = applyHardRules({ ...base, observations: [{ ...yes("isolate"), result }, yes("strip")] });
    expect(out).toEqual({ verdict: "needs_review", livenessCheck: "yes", safetyFlags: ["isolate"] });
  });
  it("treats a missing safety Observation as a flag", () => {
    const out = applyHardRules({ ...base, observations: [yes("strip")] });
    expect(out.verdict).toBe("needs_review");
    expect(out.safetyFlags).toEqual(["isolate"]);
  });
  it("does not flag a non-safety item", () => {
    const out = applyHardRules({ ...base, observations: [yes("isolate"), { ...yes("strip"), result: "no" }] });
    expect(out).toEqual({ verdict: "pass", livenessCheck: "yes", safetyFlags: [] });
  });
  it.each([
    ["digits that don't match", { read: "481", check: "yes" as const }],
    ["unreadable digits", { read: null, check: "unclear" as const }],
    ["a worker that says unclear", { read: "482", check: "unclear" as const }],
  ])("caps pass on %s", (_label, liveness) => {
    const out = applyHardRules({ ...base, liveness });
    expect(out).toEqual({ verdict: "needs_review", livenessCheck: "unclear", safetyFlags: [] });
  });
  it("keeps worker-sent flags and never raises a verdict", () => {
    expect(applyHardRules({ ...base, safetyFlags: ["other"] }).safetyFlags).toEqual(["other"]);
    expect(applyHardRules({ ...base, verdict: "fail" }).verdict).toBe("fail");
    expect(applyHardRules({ ...base, verdict: "needs_review" }).verdict).toBe("needs_review");
  });
  it("flags a safety item with duplicate Observations if any of them is not yes (F1, defense in depth)", () => {
    const out = applyHardRules({
      ...base,
      observations: [yes("isolate"), { ...yes("isolate"), result: "no" }, yes("strip")],
    });
    expect(out).toEqual({ verdict: "needs_review", livenessCheck: "yes", safetyFlags: ["isolate"] });
  });
});

describe("hasDuplicateItemId (F1)", () => {
  it("is false for distinct itemIds", () => {
    expect(hasDuplicateItemId([yes("isolate"), yes("strip")])).toBe(false);
  });
  it("is true when an itemId repeats", () => {
    expect(hasDuplicateItemId([yes("isolate"), yes("isolate")])).toBe(true);
  });
  it("is false for an empty list", () => {
    expect(hasDuplicateItemId([])).toBe(false);
  });
});

describe("fillMissingObservations (F2, spec §6 rule 2)", () => {
  it("adds an unclear Observation for each Rubric item with none", () => {
    const filled = fillMissingObservations(ITEMS, [yes("strip")]);
    expect(filled).toEqual([yes("strip"), { itemId: "isolate", result: "unclear", evidence: "", timestampS: 0 }]);
  });
  it("changes nothing when every item already has an Observation", () => {
    const observations = [yes("isolate"), yes("strip")];
    expect(fillMissingObservations(ITEMS, observations)).toEqual(observations);
  });
});

describe("resultInBounds (F4)", () => {
  const knownItemIds = new Set(ITEMS.map((i: RubricItem) => i.id));
  const okBody: ResultCallbackBody = {
    assessmentId: "a1",
    attempt: 1,
    outcome: "result",
    observations: [yes("isolate"), yes("strip")],
    liveness: { read: "482", check: "yes" },
    verdict: { verdict: "pass", confidence: 0.9, strengths: ["neat"], gaps: [], feedbackEn: "Good." },
    safetyFlags: [],
    model: "stub@v1",
    fallbackModel: false,
    latencyMs: 1200,
  };

  it("accepts a body within every bound", () => {
    expect(resultInBounds(okBody, knownItemIds)).toBe(true);
  });
  it.each([
    ["confidence below 0", { ...okBody, verdict: { ...okBody.verdict, confidence: -0.01 } }],
    ["confidence above 1", { ...okBody, verdict: { ...okBody.verdict, confidence: 1.01 } }],
    ["a negative latencyMs", { ...okBody, latencyMs: -1 }],
    ["a negative timestampS", { ...okBody, observations: [{ ...yes("isolate"), timestampS: -1 }, yes("strip")] }],
    ["too many strengths", { ...okBody, verdict: { ...okBody.verdict, strengths: Array(MAX_LIST_ITEMS + 1).fill("x") } }],
    ["too many gaps", { ...okBody, verdict: { ...okBody.verdict, gaps: Array(MAX_LIST_ITEMS + 1).fill("x") } }],
    ["too many safetyFlags", { ...okBody, safetyFlags: Array(MAX_LIST_ITEMS + 1).fill("isolate") }],
    ["too long feedbackEn", { ...okBody, verdict: { ...okBody.verdict, feedbackEn: "x".repeat(MAX_TEXT_LENGTH + 1) } }],
    [
      "too long feedbackSw",
      { ...okBody, verdict: { ...okBody.verdict, feedbackSw: "x".repeat(MAX_TEXT_LENGTH + 1) } },
    ],
    [
      "too long Observation evidence",
      { ...okBody, observations: [{ ...yes("isolate"), evidence: "x".repeat(MAX_TEXT_LENGTH + 1) }, yes("strip")] },
    ],
    ["too long model", { ...okBody, model: "x".repeat(MAX_MODEL_LENGTH + 1) }],
    ["a safetyFlags id not in the Rubric", { ...okBody, safetyFlags: ["made-up"] }],
  ])("refuses %s", (_label, body) => {
    expect(resultInBounds(body as ResultCallbackBody, knownItemIds)).toBe(false);
  });
});

describe("errorCodeInBounds (F4)", () => {
  it("accepts a short errorCode", () => {
    expect(errorCodeInBounds("vllm_down")).toBe(true);
  });
  it("refuses an errorCode over the cap", () => {
    expect(errorCodeInBounds("x".repeat(MAX_ERROR_CODE_LENGTH + 1))).toBe(false);
  });
  it("accepts an errorCode exactly at the cap", () => {
    expect(errorCodeInBounds("x".repeat(MAX_ERROR_CODE_LENGTH))).toBe(true);
  });
});
