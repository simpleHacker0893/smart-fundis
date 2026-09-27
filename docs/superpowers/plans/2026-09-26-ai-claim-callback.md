# AI claim and callback contract (#39) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A worker holding `AI_SHARED_SECRET` can claim the oldest `queued` Assessment through `POST /ai/claim`, post a `result`, `reshoot` or `error` to `POST /ai/callback`, and a cron requeues or fails Assessments that were claimed too long ago.

**Architecture:** Two Convex HTTP actions in `convex/http.ts` do only transport work: check the bearer secret, narrow the JSON body against a Convex validator, call one internal mutation, and map its result to a status code. All state changes live in three internal mutations in `convex/aiJobs.ts` (`claim`, `callback`, `requeueStale`), so each is one transaction and the claim is atomic. The contract's shapes, constants and the ADR-11 hard rules live in `convex/lib/aiContract.ts`; the constant-time secret check and a generic "does this JSON match this validator" helper are small pure modules in `convex/lib/`.

**Tech Stack:** Convex 1.46 (HTTP actions, internal mutations, crons, file storage), TypeScript strict, vitest 5 + convex-test 0.0.59 (`t.fetch` for HTTP, `t.run` for fixtures), pnpm.

**Spec:** `docs/superpowers/specs/2026-09-25-architecture-design.md` §3 (failure paths), §5 (status table), §6 (AI contracts), §10 (test seams). Ticket: GitHub #39, parent spec #36.

## Global Constraints

- Use pnpm only (`pnpm test`, `pnpm typecheck:convex`, `pnpm exec convex ...`). Never npm or npx.
- Read `convex/_generated/ai/guidelines.md` before writing Convex code. Every function has `args` and `returns` validators. Functions only called by our own code are `internal*`.
- Index names contain every field. Queries are bounded (`.take(n)`), never `.collect()`.
- Both endpoints require `Authorization: Bearer <AI_SHARED_SECRET>`, checked with a constant-time compare. Missing or wrong → **401**.
- `/ai/claim` body `{ "workerId": string }`. Nothing queued → **204**. Otherwise **200** with exactly the §6 job body, and the Assessment moves `queued → analyzing` atomically with `attempts + 1`.
- **The video URL is never logged.** No `console.*` call may include it.
- `/ai/callback` outcomes: `result → awaiting_review`, `reshoot → reshoot`, `error → queued` if attempts < 2 else `failed`.
- A callback whose Assessment is not `analyzing`, or whose `attempt` differs, returns **409** and changes nothing.
- Stuck job: `analyzing` for more than **10 minutes** → `queued` on the first attempt, `failed` once attempts reach **2**.
- ADR-11 (non-negotiable): a safety item marked `no` or `unclear`, or a liveness check that is not `yes`, caps a `pass` at `needs_review`. The AI recommends; nothing here creates a Badge.
- English only for now (D-64): the contract keeps `feedbackSw` and `reason.sw`, but they are **optional**, so the stub worker (#40) need not write Kiswahili.
- Stay inside `convex/` (plus this plan and the handoff). Use CONTEXT.md terms: Assessment, Rubric, Observation, Verdict, Liveness code, Trade, Task.
- Commit messages: `feat(convex): … (#39)` / `test(convex): … (#39)`, ending with the `Co-Authored-By` line the session gives.

## Review Focus

1. **`AI_SHARED_SECRET` unset or empty on a deployment** → every call is 401, even `Authorization: Bearer ` with an empty token. Pinned in Task 1 (`aiSecret.test.ts`) and Task 2.
2. **A body that is not JSON, not an object, has extra or missing fields, or wrong types** → 400 and nothing changes. Pinned in Task 1 (`conforms.test.ts`), Task 2 and Task 3.
3. **A `queued` Assessment whose video, Rubric or Trade is gone** must not wedge the queue: it becomes `failed` and the next one is claimed. Pinned in Task 2.
4. **A worker that says `pass` while a safety item is `no`/`unclear`/missing or the Liveness digits don't match** → stored as `needs_review` with the safety flag, enforced on the server (ADR-11 defence in depth). Pinned in Task 3.
5. **A callback `assessmentId` that is not a valid Assessment id** (garbage string, another table's id, deleted row) → 409, not 500. Pinned in Task 3.

## Decisions this plan makes (flag to the Architect in the handoff)

- **Schema fixes from #37:** `assessments.fallbackModel` becomes `v.optional(v.boolean())` (the spec and PRD US-4.6 say boolean; #37 wrote string; no row has it yet). `reshootReasonValidator.sw` becomes optional (D-64).
- **Unclaimable queued row → `failed`.** The status table has no `queued → failed` row. The claim marks such a row `failed` (with `attempts + 1`, as if claimed and failed at once) because leaving it `queued` would block the head of the queue forever. `failed` means a system error, which this is.
- **Server-side hard rules.** Convex re-applies the ADR-11 cap and recomputes `livenessCheck` from the stored Liveness code, rather than trusting the worker's `rules.py` alone.
- **Unknown Observation item id** → 400 (`unknown_item`), the row stays `analyzing` and the cron recovers it. Missing items are handled by the cap.
- Env var read with `process.env.AI_SHARED_SECRET`, matching `lib/auth.ts` (`ADMIN_EMAILS`). Set it per deployment: `pnpm exec convex env set AI_SHARED_SECRET <value>`.

## File map

| File | Responsibility |
| --- | --- |
| `convex/schema.ts` (modify line 131) | `fallbackModel` → boolean |
| `convex/lib/validators.ts` (modify) | `reshootReason.sw` optional; export `Observation`, `Verdict`, `LivenessCheck` types |
| `convex/lib/aiSecret.ts` (create) | `isWorkerAuthorized(header, secret)` — constant-time bearer check |
| `convex/lib/conforms.ts` (create) | `conforms(validator, value)` — type guard: does untrusted JSON match a Convex validator |
| `convex/lib/aiContract.ts` (create) | constants, `claimBodyValidator`, `callbackBodyValidator`, `jobValidator`, `applyHardRules` |
| `convex/aiJobs.ts` (create) | internal mutations `claim`, `callback`, `requeueStale` |
| `convex/http.ts` (create) | router: `POST /ai/claim`, `POST /ai/callback` |
| `convex/crons.ts` (create) | every minute → `internal.aiJobs.requeueStale` |
| `convex/lib/aiSecret.test.ts`, `convex/lib/conforms.test.ts`, `convex/lib/aiContract.test.ts`, `convex/aiJobs.test.ts` (create) | tests |

---

### Task 1: Contract building blocks (secret check, JSON narrowing, shapes, hard rules, schema fixes)

**Files:**
- Modify: `convex/schema.ts:131`, `convex/lib/validators.ts`
- Create: `convex/lib/aiSecret.ts`, `convex/lib/conforms.ts`, `convex/lib/aiContract.ts`
- Test: `convex/lib/aiSecret.test.ts`, `convex/lib/conforms.test.ts`, `convex/lib/aiContract.test.ts`

**Interfaces:**
- Produces:
  - `isWorkerAuthorized(authorization: string | null, secret: string | undefined): Promise<boolean>`
  - `conforms<V extends GenericValidator>(validator: V, value: unknown): value is V["type"]`
  - `CLAIM_TIMEOUT_MS = 600_000`, `MAX_ATTEMPTS = 2`, `MAX_WORKER_ID_LENGTH = 100`, `CLAIM_SCAN = 5`
  - `claimBodyValidator`, `callbackBodyValidator`, `jobValidator` and types `ClaimBody`, `CallbackBody`, `Job`
  - `applyHardRules(input): { verdict: Verdict; livenessCheck: LivenessCheck; safetyFlags: string[] }`
  - types `Observation`, `Verdict`, `LivenessCheck` from `lib/validators.ts`

- [ ] **Step 1: Write the failing tests**

`convex/lib/aiSecret.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { isWorkerAuthorized } from "./aiSecret";

const SECRET = "s3cret-value-for-tests";

describe("isWorkerAuthorized (spec §6)", () => {
  it("accepts the exact bearer secret", async () => {
    expect(await isWorkerAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });
  it.each([
    ["no header", null],
    ["a wrong secret of the same length", `Bearer ${"x".repeat(SECRET.length)}`],
    ["a longer secret", `Bearer ${SECRET}x`],
    ["a prefix of the secret", `Bearer ${SECRET.slice(0, 5)}`],
    ["no Bearer scheme", SECRET],
    ["a lowercase scheme", `bearer ${SECRET}`],
    ["an empty token", "Bearer "],
  ])("refuses %s", async (_label, header) => {
    expect(await isWorkerAuthorized(header, SECRET)).toBe(false);
  });
  it("refuses everything when the secret is not configured", async () => {
    expect(await isWorkerAuthorized("Bearer ", "")).toBe(false);
    expect(await isWorkerAuthorized("Bearer ", undefined)).toBe(false);
    expect(await isWorkerAuthorized("Bearer anything", undefined)).toBe(false);
  });
});
```

`convex/lib/conforms.test.ts`:
```ts
import { v } from "convex/values";
import { describe, expect, it } from "vitest";
import { conforms } from "./conforms";

const shape = v.object({
  id: v.string(),
  n: v.number(),
  ok: v.boolean(),
  kind: v.union(v.literal("a"), v.literal("b")),
  tags: v.array(v.string()),
  read: v.union(v.string(), v.null()),
  note: v.optional(v.string()),
});
const good = { id: "x", n: 1, ok: true, kind: "a", tags: ["t"], read: null };

describe("conforms", () => {
  it("accepts a matching value, with or without the optional field", () => {
    expect(conforms(shape, good)).toBe(true);
    expect(conforms(shape, { ...good, note: "hi" })).toBe(true);
  });
  it.each([
    ["undefined (body was not JSON)", undefined],
    ["null", null],
    ["an array", [good]],
    ["a string", "{}"],
    ["a missing required field", { ...good, id: undefined }],
    ["an extra field", { ...good, extra: 1 }],
    ["a wrong type", { ...good, n: "1" }],
    ["a non-finite number", { ...good, n: Number.POSITIVE_INFINITY }],
    ["a literal outside the union", { ...good, kind: "c" }],
    ["a bad array element", { ...good, tags: [1] }],
    ["a wrong-typed optional", { ...good, note: 3 }],
  ])("refuses %s", (_label, value) => {
    expect(conforms(shape, value)).toBe(false);
  });
});
```

`convex/lib/aiContract.test.ts`:
```ts
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run convex/lib/aiSecret.test.ts convex/lib/conforms.test.ts convex/lib/aiContract.test.ts`
Expected: FAIL — cannot resolve `./aiSecret`, `./conforms`, `./aiContract`.

- [ ] **Step 3: Implement**

`convex/lib/validators.ts` — after `observationValidator`, `verdictValidator` and `livenessCheckValidator`, add the types; make `sw` optional:
```ts
export type Observation = Infer<typeof observationValidator>;
export type Verdict = Infer<typeof verdictValidator>;
export type LivenessCheck = Infer<typeof livenessCheckValidator>;
```
```ts
  en: v.string(),
  // Optional: English only for now (D-64). The V2 pipeline may send it.
  sw: v.optional(v.string()),
```

`convex/schema.ts:131`:
```ts
    // True when the worker used the 2B fallback model (spec §3, US-4.6).
    fallbackModel: v.optional(v.boolean()),
```

`convex/lib/aiSecret.ts`:
```ts
// The /ai/* bearer check (spec §6). Both sides are hashed to SHA-256 first, so
// the byte compare always runs over 32 bytes and its time does not depend on
// where, or whether, the token and the secret differ, nor on their lengths.

const PREFIX = "Bearer ";

/** True only for `Bearer <secret>`. An unset or empty secret refuses everyone. */
export async function isWorkerAuthorized(
  authorization: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || authorization === null || !authorization.startsWith(PREFIX)) {
    return false;
  }
  const [token, expected] = await Promise.all([
    sha256(authorization.slice(PREFIX.length)),
    sha256(secret),
  ]);
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= token[i] ^ expected[i];
  }
  return diff === 0;
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}
```

`convex/lib/conforms.ts`:
```ts
import type { GenericValidator } from "convex/values";

/**
 * Whether untrusted JSON (an HTTP body) matches a Convex validator, the same
 * way argument validation would: required fields present, no extra fields,
 * finite numbers. Lets an HTTP action answer 400 before calling a mutation,
 * with the validator as the one definition of the shape.
 */
export function conforms<V extends GenericValidator>(validator: V, value: unknown): value is V["type"] {
  // A generic V doesn't narrow on `kind`; the widened union does.
  const val: GenericValidator = validator;
  switch (val.kind) {
    case "string":
    case "id":
      return typeof value === "string";
    case "float64":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    case "literal":
      return value === val.value;
    case "array":
      return Array.isArray(value) && value.every((element) => conforms(val.element, element));
    case "union":
      return val.members.some((member) => conforms(member, value));
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
      }
      const record = value as Record<string, unknown>;
      if (Object.keys(record).some((key) => !(key in val.fields))) {
        return false;
      }
      return Object.entries(val.fields).every(([key, field]) =>
        record[key] === undefined ? field.isOptional === "optional" : conforms(field, record[key]),
      );
    }
    default:
      return false;
  }
}
```
(Check `node_modules/convex/dist/esm-types/values/validators.d.ts` for the runtime property names `kind`, `isOptional`, `fields`, `element`, `members`, `value` before relying on them; adjust if they differ.)

`convex/lib/aiContract.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify they pass, and typecheck**

Run: `pnpm exec vitest run convex/lib/aiSecret.test.ts convex/lib/conforms.test.ts convex/lib/aiContract.test.ts && pnpm typecheck:convex`
Expected: all PASS; tsc exits 0. Also run `pnpm test:convex` — existing tests stay green after the schema/validator change.

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts convex/lib/validators.ts convex/lib/aiSecret.ts convex/lib/conforms.ts convex/lib/aiContract.ts convex/lib/*.test.ts
git commit -m "feat(convex): AI contract shapes, bearer check and hard rules (#39)"
```

---

### Task 2: `POST /ai/claim`

**Files:**
- Create: `convex/aiJobs.ts` (`claim`), `convex/http.ts`
- Test: `convex/aiJobs.test.ts` (claim block + shared fixtures)

**Interfaces:**
- Consumes: `isWorkerAuthorized`, `conforms`, `claimBodyValidator`, `jobValidator`, `Job`, `MAX_WORKER_ID_LENGTH`, `CLAIM_SCAN` (Task 1).
- Produces: `internal.aiJobs.claim({ workerId: string }) → Job | null`; `convex/http.ts` with helpers `json(status, body)` and `readJson(req)` that Task 3 reuses; test helpers `setup`, `queued`, `post`, `SECRET` in `aiJobs.test.ts`.

- [ ] **Step 1: Write the failing tests**

`convex/aiJobs.test.ts`:
```ts
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

const SECRET = "test-ai-shared-secret";

function setup() {
  return convexTest(schema, modules);
}
type T = ReturnType<typeof setup>;

beforeEach(() => {
  vi.stubEnv("AI_SHARED_SECRET", SECRET);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Seeds the Trades (idempotent) and inserts one Electrical Assessment, `queued` by default. */
async function queued(t: T, overrides: Partial<Doc<"assessments">> = {}): Promise<Id<"assessments">> {
  await t.mutation(internal.seed.trades, {});
  return t.run(async (ctx) => {
    const trade = await ctx.db
      .query("trades")
      .withIndex("by_slug", (q) => q.eq("slug", "electrical"))
      .unique();
    const userId = await ctx.db.insert("users", { clerkId: `test|${Math.random()}`, email: "f@example.com", name: "Fundi" });
    const videoStorageId = await ctx.storage.store(new Blob(["video"], { type: "video/mp4" }));
    return ctx.db.insert("assessments", {
      fundiUserId: userId,
      tradeSlug: "electrical",
      rubricId: trade!.activeRubricId!,
      consentVersion: "consent-v1",
      consentAt: Date.now(),
      videoStorageId,
      livenessCode: "482",
      status: "queued",
      attempts: 0,
      licenseStatus: "none",
      ...overrides,
    });
  });
}

function post(t: T, path: string, body: unknown, authorization: string | null = `Bearer ${SECRET}`) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authorization !== null) headers.Authorization = authorization;
  return t.fetch(path, { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}

const get = (t: T, id: Id<"assessments">) => t.run((ctx) => ctx.db.get("assessments", id));

describe("POST /ai/claim (spec §6, US-4.1)", () => {
  it.each([
    ["no Authorization header", null],
    ["a wrong secret", "Bearer wrong"],
  ])("returns 401 for %s and claims nothing", async (_label, auth) => {
    const t = setup();
    const id = await queued(t);
    const res = await post(t, "/ai/claim", { workerId: "w1" }, auth);
    expect(res.status).toBe(401);
    expect((await get(t, id))!.status).toBe("queued");
  });

  it("returns 401 when AI_SHARED_SECRET is not set on the deployment", async () => {
    vi.stubEnv("AI_SHARED_SECRET", "");
    const t = setup();
    expect((await post(t, "/ai/claim", { workerId: "w1" }, "Bearer ")).status).toBe(401);
  });

  it("returns 204 when nothing is queued", async () => {
    const t = setup();
    const res = await post(t, "/ai/claim", { workerId: "w1" });
    expect(res.status).toBe(204);
  });

  it.each([
    ["a non-JSON body", "not json"],
    ["no workerId", {}],
    ["an empty workerId", { workerId: "" }],
    ["a too-long workerId", { workerId: "w".repeat(101) }],
    ["an extra field", { workerId: "w1", extra: true }],
  ])("returns 400 for %s and claims nothing", async (_label, body) => {
    const t = setup();
    const id = await queued(t);
    expect((await post(t, "/ai/claim", body)).status).toBe(400);
    expect((await get(t, id))!.status).toBe("queued");
  });

  it("returns the §6 job and moves the Assessment to analyzing with attempts + 1", async () => {
    const t = setup();
    const id = await queued(t);
    const res = await post(t, "/ai/claim", { workerId: "w1" });
    expect(res.status).toBe(200);
    const job = await res.json();
    const row = (await get(t, id))!;
    const rubric = await t.run((ctx) => ctx.db.get("rubrics", row.rubricId));
    expect(job).toEqual({
      assessmentId: id,
      attempt: 1,
      videoUrl: expect.any(String),
      trade: { slug: "electrical", name: "Electrical" },
      task: { slug: rubric!.taskSlug, name: rubric!.taskName },
      rubric: { id: rubric!._id, version: rubric!.version, items: rubric!.items },
      livenessCode: "482",
    });
    expect(row).toMatchObject({ status: "analyzing", attempts: 1, claimedBy: "w1" });
    expect(row.claimedAt).toEqual(expect.any(Number));
  });

  it("claims oldest first, never the same Assessment twice (two pollers)", async () => {
    const t = setup();
    const first = await queued(t);
    const second = await queued(t);
    const a = await (await post(t, "/ai/claim", { workerId: "w1" })).json();
    const b = await (await post(t, "/ai/claim", { workerId: "w2" })).json();
    expect([a.assessmentId, b.assessmentId]).toEqual([first, second]);
    expect((await post(t, "/ai/claim", { workerId: "w3" })).status).toBe(204);
  });

  it("ignores Assessments that are not queued", async () => {
    const t = setup();
    await queued(t, { status: "awaiting_review", attempts: 1 });
    expect((await post(t, "/ai/claim", { workerId: "w1" })).status).toBe(204);
  });

  it("fails a queued Assessment with no video and claims the next one", async () => {
    const t = setup();
    const broken = await queued(t, { videoStorageId: undefined });
    const good = await queued(t);
    const job = await (await post(t, "/ai/claim", { workerId: "w1" })).json();
    expect(job.assessmentId).toBe(good);
    expect(await get(t, broken)).toMatchObject({ status: "failed", attempts: 1 });
  });

  it("never logs the video URL", async () => {
    const t = setup();
    await queued(t, { videoStorageId: undefined });
    await queued(t);
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const job = await (await post(t, "/ai/claim", { workerId: "w1" })).json();
    const logged = spies.flatMap((s) => s.mock.calls.flat().map(String)).join("\n");
    expect(logged).not.toContain(job.videoUrl);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run convex/aiJobs.test.ts`
Expected: FAIL — `/ai/claim` is not routed (404 instead of 401/204/200), `internal.aiJobs` does not exist.

- [ ] **Step 3: Implement**

`convex/aiJobs.ts`:
```ts
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
```

`convex/http.ts`:
```ts
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { claimBodyValidator, MAX_WORKER_ID_LENGTH } from "./lib/aiContract";
import { isWorkerAuthorized } from "./lib/aiSecret";
import { conforms } from "./lib/conforms";

// The pull-model AI contract (spec §6, ADR-9). Brev calls out to these; there
// is no inbound port on Brev. These handlers never log a request or a job:
// the job carries the signed video URL.

const http = httpRouter();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** The parsed JSON body, or undefined when it isn't JSON (conforms then refuses it). */
async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

const authorized = (req: Request) =>
  isWorkerAuthorized(req.headers.get("Authorization"), process.env.AI_SHARED_SECRET);

http.route({
  path: "/ai/claim",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!(await authorized(req))) {
      return json(401, { error: "unauthorized" });
    }
    const body = await readJson(req);
    if (
      !conforms(claimBodyValidator, body) ||
      body.workerId.length === 0 ||
      body.workerId.length > MAX_WORKER_ID_LENGTH
    ) {
      return json(400, { error: "bad_request" });
    }
    const job = await ctx.runMutation(internal.aiJobs.claim, { workerId: body.workerId });
    return job === null ? new Response(null, { status: 204 }) : json(200, job);
  }),
});

export default http;
```

- [ ] **Step 4: Run to verify it passes, and typecheck**

Run: `pnpm exec vitest run convex/aiJobs.test.ts && pnpm typecheck:convex`
Expected: all claim tests PASS; tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add convex/aiJobs.ts convex/http.ts convex/aiJobs.test.ts
git commit -m "feat(convex): POST /ai/claim with an atomic oldest-first claim (#39)"
```

---

### Task 3: `POST /ai/callback`

**Files:**
- Modify: `convex/aiJobs.ts` (add `callback`), `convex/http.ts` (add route)
- Test: `convex/aiJobs.test.ts` (add callback block)

**Interfaces:**
- Consumes: `callbackBodyValidator`, `CallbackBody`, `applyHardRules`, `MAX_ATTEMPTS` (Task 1); `json`, `readJson`, `authorized` in `http.ts` and `setup`, `queued`, `post`, `get` in the test file (Task 2).
- Produces: `internal.aiJobs.callback({ body: CallbackBody }) → { ok: true; status: AssessmentStatus } | { ok: false; reason: "stale" | "unknown_item" }`.

- [ ] **Step 1: Write the failing tests** (append to `convex/aiJobs.test.ts`)

```ts
/** Claims the one queued Assessment and returns its job. */
async function claimed(t: T, overrides: Partial<Doc<"assessments">> = {}) {
  const id = await queued(t, overrides);
  const job = await (await post(t, "/ai/claim", { workerId: "w1" })).json();
  expect(job.assessmentId).toBe(id);
  return job as { assessmentId: Id<"assessments">; attempt: number; rubric: { items: { id: string; safety: boolean }[] } };
}

function resultBody(job: Awaited<ReturnType<typeof claimed>>, patch: Record<string, unknown> = {}) {
  return {
    assessmentId: job.assessmentId,
    attempt: job.attempt,
    outcome: "result",
    observations: job.rubric.items.map((i) => ({ itemId: i.id, result: "yes", evidence: "seen", timestampS: 3 })),
    liveness: { read: "482", check: "yes" },
    verdict: { verdict: "pass", confidence: 0.9, strengths: ["neat"], gaps: [], feedbackEn: "Good work." },
    safetyFlags: [],
    model: "stub@v1",
    fallbackModel: false,
    latencyMs: 1200,
    ...patch,
  };
}

describe("POST /ai/callback (spec §6, US-4.1)", () => {
  it("returns 401 without the secret and changes nothing", async () => {
    const t = setup();
    const job = await claimed(t);
    expect((await post(t, "/ai/callback", resultBody(job), "Bearer wrong")).status).toBe(401);
    expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
  });

  it("result → awaiting_review, storing the AI result", async () => {
    const t = setup();
    const job = await claimed(t);
    const res = await post(t, "/ai/callback", resultBody(job));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "awaiting_review" });
    expect(await get(t, job.assessmentId)).toMatchObject({
      status: "awaiting_review",
      verdict: "pass",
      confidence: 0.9,
      strengths: ["neat"],
      gaps: [],
      feedbackEn: "Good work.",
      livenessRead: "482",
      livenessCheck: "yes",
      safetyFlags: [],
      model: "stub@v1",
      fallbackModel: false,
      latencyMs: 1200,
    });
  });

  it("caps a pass with an unclear safety item at needs_review (ADR-11)", async () => {
    const t = setup();
    const job = await claimed(t);
    const safety = job.rubric.items.find((i) => i.safety)!;
    const body = resultBody(job);
    body.observations = body.observations.map((o) => (o.itemId === safety.id ? { ...o, result: "unclear" } : o));
    await post(t, "/ai/callback", body);
    expect(await get(t, job.assessmentId)).toMatchObject({ verdict: "needs_review", safetyFlags: [safety.id] });
  });

  it("caps a pass whose Liveness digits don't match at needs_review", async () => {
    const t = setup();
    const job = await claimed(t);
    await post(t, "/ai/callback", resultBody(job, { liveness: { read: "999", check: "yes" } }));
    expect(await get(t, job.assessmentId)).toMatchObject({ verdict: "needs_review", livenessCheck: "unclear", livenessRead: "999" });
  });

  it("reshoot → reshoot with the reason", async () => {
    const t = setup();
    const job = await claimed(t);
    const reason = { code: "too_dark", en: "The video is too dark." };
    const res = await post(t, "/ai/callback", { assessmentId: job.assessmentId, attempt: 1, outcome: "reshoot", reason });
    expect(res.status).toBe(200);
    expect(await get(t, job.assessmentId)).toMatchObject({ status: "reshoot", reshootReason: reason });
  });

  it("error on attempt 1 → queued again; error on attempt 2 → failed", async () => {
    const t = setup();
    const job = await claimed(t);
    const error = (attempt: number) => ({ assessmentId: job.assessmentId, attempt, outcome: "error", errorCode: "vllm_down" });
    expect(await (await post(t, "/ai/callback", error(1))).json()).toEqual({ status: "queued" });
    const requeued = (await get(t, job.assessmentId))!;
    expect(requeued).toMatchObject({ status: "queued", attempts: 1 });
    expect(requeued.claimedAt).toBeUndefined();

    const again = await (await post(t, "/ai/claim", { workerId: "w2" })).json();
    expect(again.attempt).toBe(2);
    expect(await (await post(t, "/ai/callback", error(2))).json()).toEqual({ status: "failed" });
    expect(await get(t, job.assessmentId)).toMatchObject({ status: "failed", attempts: 2 });
  });

  describe("stale callbacks return 409 and change nothing", () => {
    it("when the Assessment is not analyzing (a second callback)", async () => {
      const t = setup();
      const job = await claimed(t);
      await post(t, "/ai/callback", resultBody(job));
      const before = await get(t, job.assessmentId);
      const res = await post(t, "/ai/callback", resultBody(job, { verdict: { verdict: "fail", confidence: 0.1, strengths: [], gaps: [], feedbackEn: "x" } }));
      expect(res.status).toBe(409);
      expect(await get(t, job.assessmentId)).toEqual(before);
    });

    it("when the attempt differs (a callback after a requeue and re-claim)", async () => {
      const t = setup();
      const job = await claimed(t);
      await post(t, "/ai/callback", { assessmentId: job.assessmentId, attempt: 1, outcome: "error", errorCode: "x" });
      await post(t, "/ai/claim", { workerId: "w2" });
      const before = await get(t, job.assessmentId);
      expect((await post(t, "/ai/callback", resultBody(job))).status).toBe(409); // still attempt 1
      expect(await get(t, job.assessmentId)).toEqual(before);
    });

    it("when the Assessment was deleted", async () => {
      const t = setup();
      const job = await claimed(t);
      await t.run((ctx) => ctx.db.delete("assessments", job.assessmentId));
      expect((await post(t, "/ai/callback", resultBody(job))).status).toBe(409);
    });

    it.each([["garbage", "not-an-id"]])("when the assessmentId is %s", async (_label, assessmentId) => {
      const t = setup();
      const job = await claimed(t);
      expect((await post(t, "/ai/callback", resultBody(job, { assessmentId }))).status).toBe(409);
    });

    it("when the assessmentId belongs to another table", async () => {
      const t = setup();
      const job = await claimed(t);
      const row = (await get(t, job.assessmentId))!;
      const res = await post(t, "/ai/callback", resultBody(job, { assessmentId: row.rubricId }));
      expect(res.status).toBe(409);
      expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
    });
  });

  it.each([
    ["a non-JSON body", () => "nope"],
    ["an unknown outcome", (j: Awaited<ReturnType<typeof claimed>>) => ({ assessmentId: j.assessmentId, attempt: 1, outcome: "maybe" })],
    ["a result missing fields", (j: Awaited<ReturnType<typeof claimed>>) => ({ assessmentId: j.assessmentId, attempt: 1, outcome: "result" })],
    ["a bad reshoot code", (j: Awaited<ReturnType<typeof claimed>>) => ({ assessmentId: j.assessmentId, attempt: 1, outcome: "reshoot", reason: { code: "blurry", en: "x" } })],
    ["an Observation for an item not in the Rubric", (j: Awaited<ReturnType<typeof claimed>>) =>
      resultBody(j, { observations: [{ itemId: "made-up", result: "yes", evidence: "e", timestampS: 1 }] })],
  ])("returns 400 for %s and leaves the Assessment analyzing", async (_label, make) => {
    const t = setup();
    const job = await claimed(t);
    expect((await post(t, "/ai/callback", make(job))).status).toBe(400);
    expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run convex/aiJobs.test.ts`
Expected: the callback tests FAIL (404: `/ai/callback` not routed); the claim tests still PASS.

- [ ] **Step 3: Implement**

Add to `convex/aiJobs.ts` (extend the imports: `applyHardRules`, `callbackBodyValidator`, `MAX_ATTEMPTS` from `./lib/aiContract`; `assessmentStatusValidator` from `./lib/validators`):
```ts
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
```

Add to `convex/http.ts` (import `callbackBodyValidator` too), before `export default http`:
```ts
http.route({
  path: "/ai/callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!(await authorized(req))) {
      return json(401, { error: "unauthorized" });
    }
    const body = await readJson(req);
    if (!conforms(callbackBodyValidator, body)) {
      return json(400, { error: "bad_request" });
    }
    const result = await ctx.runMutation(internal.aiJobs.callback, { body });
    if (!result.ok) {
      return json(result.reason === "stale" ? 409 : 400, { error: result.reason });
    }
    return json(200, { status: result.status });
  }),
});
```

- [ ] **Step 4: Run to verify it passes, and typecheck**

Run: `pnpm exec vitest run convex/aiJobs.test.ts && pnpm typecheck:convex`
Expected: all PASS; tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add convex/aiJobs.ts convex/http.ts convex/aiJobs.test.ts
git commit -m "feat(convex): POST /ai/callback with stale-callback 409 and ADR-11 cap (#39)"
```

---

### Task 4: The requeue-and-fail cron, then the full suite

**Files:**
- Modify: `convex/aiJobs.ts` (add `requeueStale`)
- Create: `convex/crons.ts`
- Test: `convex/aiJobs.test.ts` (add cron block)

**Interfaces:**
- Consumes: `CLAIM_TIMEOUT_MS`, `MAX_ATTEMPTS` (Task 1); `queued`, `get`, `setup` (Task 2).
- Produces: `internal.aiJobs.requeueStale({}) → { requeued: number; failed: number }`; `convex/crons.ts` default export.

- [ ] **Step 1: Write the failing tests** (append to `convex/aiJobs.test.ts`)

```ts
describe("requeueStale cron (spec §3 stuck job)", () => {
  const MINUTE = 60 * 1000;

  it("requeues a first-attempt claim older than 10 minutes and fails a second", async () => {
    const t = setup();
    const now = Date.now();
    const first = await queued(t, { status: "analyzing", attempts: 1, claimedAt: now - 11 * MINUTE, claimedBy: "w1" });
    const second = await queued(t, { status: "analyzing", attempts: 2, claimedAt: now - 11 * MINUTE, claimedBy: "w1" });
    const fresh = await queued(t, { status: "analyzing", attempts: 1, claimedAt: now - 1 * MINUTE, claimedBy: "w1" });
    const waiting = await queued(t);

    expect(await t.mutation(internal.aiJobs.requeueStale, {})).toEqual({ requeued: 1, failed: 1 });

    const requeued = (await get(t, first))!;
    expect(requeued).toMatchObject({ status: "queued", attempts: 1 });
    expect(requeued.claimedAt).toBeUndefined();
    expect(requeued.claimedBy).toBeUndefined();
    expect(await get(t, second)).toMatchObject({ status: "failed", attempts: 2 });
    expect(await get(t, fresh)).toMatchObject({ status: "analyzing", attempts: 1 });
    expect(await get(t, waiting)).toMatchObject({ status: "queued", attempts: 0 });
  });

  it("makes the late callback of a requeued job stale", async () => {
    const t = setup();
    const id = await queued(t, { status: "analyzing", attempts: 1, claimedAt: Date.now() - 11 * MINUTE });
    await t.mutation(internal.aiJobs.requeueStale, {});
    const res = await post(t, "/ai/callback", { assessmentId: id, attempt: 1, outcome: "error", errorCode: "late" });
    expect(res.status).toBe(409);
    expect((await get(t, id))!.status).toBe("queued");
  });

  it("is registered as a cron", async () => {
    const crons = (await import("./crons")).default;
    expect(Object.keys(crons.crons)).toContain("requeue stale AI claims");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run convex/aiJobs.test.ts`
Expected: FAIL — `internal.aiJobs.requeueStale` and `./crons` don't exist.

- [ ] **Step 3: Implement**

Add to `convex/aiJobs.ts` (import `CLAIM_TIMEOUT_MS`):
```ts
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
```

`convex/crons.ts`:
```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Stuck AI jobs (spec §3): requeue or fail Assessments claimed > 10 min ago.
crons.interval("requeue stale AI claims", { minutes: 1 }, internal.aiJobs.requeueStale, {});

export default crons;
```
(If `crons.crons` isn't the property name on the `cronJobs()` object in convex 1.46, read `node_modules/convex/dist/esm-types/server/cron.d.ts` and adjust the registration test to the real property.)

- [ ] **Step 4: Run the whole suite and typecheck**

Run: `pnpm exec vitest run convex/aiJobs.test.ts && pnpm typecheck:convex && pnpm test`
Expected: all PASS, tsc exits 0, `pnpm test` green (check:env, convex tests, web tests).

- [ ] **Step 5: Commit**

```bash
git add convex/aiJobs.ts convex/crons.ts convex/aiJobs.test.ts
git commit -m "feat(convex): requeue-and-fail cron for stuck AI claims (#39)"
```

---

## Acceptance criteria → tests

| #39 criterion | Test |
| --- | --- |
| Constant-time bearer, 401 when missing/wrong | `aiSecret.test.ts`; claim + callback 401 tests |
| Claim 204 / 200 §6 body / atomic `queued → analyzing`, attempts + 1 / URL never logged | Task 2 tests |
| Callback `result` / `reshoot` / `error` (requeue < 2, else failed) | Task 3 tests |
| 409 and no change: not analyzing, wrong attempt, deleted, two pollers, after requeue | Task 3 "stale" block + Task 4 late-callback test |
| Cron requeues old claims, fails at attempts 2 | Task 4 tests |
| convex-test covers every row; plan reviewed | this plan + `aiJobs.test.ts` |
| `pnpm test` green | Task 4 Step 4 |
