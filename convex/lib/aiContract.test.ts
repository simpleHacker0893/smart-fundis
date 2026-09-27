import { describe, expect, it } from "vitest";
import { applyHardRules } from "./aiContract";
import type { Observation } from "./validators";

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
});
