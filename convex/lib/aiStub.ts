// The dev-only V1 stub worker switch (#40, RAI review S1+S2, 2026-09-27).
// `AI_STUB_ENABLED` is a Convex env var set to "1" on the dev deployment only
// and left unset on prod. Without it:
// - S1: assessments.create stores no `clipName` and /ai/claim sends none, so a
//   file name (which can carry personal data) is never kept or shared;
// - S2: a stub worker can't claim or post results, so canned outcomes can
//   never reach an Expert on prod (http.ts returns 403 `stub_disabled`).

/** True only when AI_STUB_ENABLED is exactly "1". Read at call time, so tests can vi.stubEnv it. */
export function isStubEnabled(): boolean {
  return process.env.AI_STUB_ENABLED === "1";
}

/** A stub worker id or model name: it starts with "stub", any case (ai-service/scripts/stub_worker.py). */
export function isStubName(name: string): boolean {
  return /^stub/i.test(name);
}
