import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { MAX_ATTEMPTS } from "./lib/aiContract";
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
    // #40: no clipName on the Assessment, so no clipName key in the job.
    expect(job).not.toHaveProperty("clipName");
  });

  it("adds the Assessment's clipName to the job when it has one and AI_STUB_ENABLED is 1 (#40, the stub worker)", async () => {
    vi.stubEnv("AI_STUB_ENABLED", "1");
    const t = setup();
    const id = await queued(t, { clipName: "review-socket.mp4" });
    const res = await post(t, "/ai/claim", { workerId: "w1" });
    expect(res.status).toBe(200);
    const job = await res.json();
    const rubric = await t.run(async (ctx) => ctx.db.get("rubrics", (await ctx.db.get("assessments", id))!.rubricId));
    expect(job).toEqual({
      assessmentId: id,
      attempt: 1,
      videoUrl: expect.any(String),
      trade: { slug: "electrical", name: "Electrical" },
      task: { slug: rubric!.taskSlug, name: rubric!.taskName },
      rubric: { id: rubric!._id, version: rubric!.version, items: rubric!.items },
      livenessCode: "482",
      clipName: "review-socket.mp4",
    });
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

  it.each([
    ["unset", undefined],
    ["\"0\"", "0"],
    ["\"true\"", "true"],
  ])("sends no clipName key when AI_STUB_ENABLED is %s, even for a row with one (S1)", async (_label, flag) => {
    vi.stubEnv("AI_STUB_ENABLED", flag);
    const t = setup();
    await queued(t, { clipName: "review-socket.mp4" });
    const res = await post(t, "/ai/claim", { workerId: "w1" });
    expect(res.status).toBe(200);
    expect(await res.json()).not.toHaveProperty("clipName");
  });

  describe("a stub worker without AI_STUB_ENABLED (S2)", () => {
    it.each(["stub-laptop", "STUB", "Stub-box"])("returns 403 stub_disabled for workerId %j and leaves the row queued", async (workerId) => {
      const t = setup();
      const id = await queued(t);
      const res = await post(t, "/ai/claim", { workerId });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "stub_disabled" });
      const row = (await get(t, id))!;
      expect(row).toMatchObject({ status: "queued", attempts: 0 });
      expect(row.claimedAt).toBeUndefined();
      expect(row.claimedBy).toBeUndefined();
    });

    it("returns 403 even when nothing is queued", async () => {
      const t = setup();
      expect((await post(t, "/ai/claim", { workerId: "stub-laptop" })).status).toBe(403);
    });

    it("still returns 401 first for a bad secret", async () => {
      const t = setup();
      expect((await post(t, "/ai/claim", { workerId: "stub-laptop" }, "Bearer wrong")).status).toBe(401);
    });

    it("claims for the stub when AI_STUB_ENABLED is 1", async () => {
      vi.stubEnv("AI_STUB_ENABLED", "1");
      const t = setup();
      const id = await queued(t);
      const res = await post(t, "/ai/claim", { workerId: "stub-laptop" });
      expect(res.status).toBe(200);
      expect(await get(t, id)).toMatchObject({ status: "analyzing", claimedBy: "stub-laptop" });
    });

    it.each([
      ["unset", undefined],
      ["1", "1"],
    ])("never affects a non-stub worker (flag %s)", async (_label, flag) => {
      vi.stubEnv("AI_STUB_ENABLED", flag);
      const t = setup();
      const id = await queued(t);
      const res = await post(t, "/ai/claim", { workerId: "brev-a100-stubborn" });
      expect(res.status).toBe(200);
      expect((await get(t, id))!.status).toBe("analyzing");
    });
  });

  it("never logs the video URL or the clip name", async () => {
    vi.stubEnv("AI_STUB_ENABLED", "1");
    const t = setup();
    await queued(t, { videoStorageId: undefined, clipName: "broken-clip.mp4" });
    await queued(t, { clipName: "fundi-clip.mp4" });
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    const job = await (await post(t, "/ai/claim", { workerId: "w1" })).json();
    const logged = spies.flatMap((s) => s.mock.calls.flat().map(String)).join("\n");
    expect(logged).not.toContain(job.videoUrl);
    expect(job.clipName).toBe("fundi-clip.mp4");
    expect(logged).not.toContain("clip.mp4");
  });
});

/** Claims the one queued Assessment and returns its job. */
async function claimed(t: T, overrides: Partial<Doc<"assessments">> = {}, workerId = "w1") {
  const id = await queued(t, overrides);
  const job = await (await post(t, "/ai/claim", { workerId })).json();
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
    model: "cosmos-test@v1",
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
      model: "cosmos-test@v1",
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

  describe("a stub callback without AI_STUB_ENABLED returns 403 stub_disabled and writes nothing (S2)", () => {
    /** A row claimed by a stub worker while the flag was on; then the flag is turned off. */
    async function stubClaimed(t: T) {
      vi.stubEnv("AI_STUB_ENABLED", "1");
      const job = await claimed(t, {}, "stub-laptop");
      vi.stubEnv("AI_STUB_ENABLED", undefined);
      return job;
    }

    async function expectForbidden(t: T, body: unknown, id: Id<"assessments">) {
      const before = (await get(t, id))!;
      const res = await post(t, "/ai/callback", body);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "stub_disabled" });
      expect(await get(t, id)).toEqual(before);
    }

    it.each(["stub-v1", "STUB@v1"])("for a result with model %j from a non-stub worker", async (model) => {
      const t = setup();
      const job = await claimed(t);
      await expectForbidden(t, resultBody(job, { model }), job.assessmentId);
    });

    it("for a result on a stub-claimed row, whatever the model", async () => {
      const t = setup();
      const job = await stubClaimed(t);
      await expectForbidden(t, resultBody(job), job.assessmentId);
    });

    it("for a reshoot on a stub-claimed row (a reshoot carries no model)", async () => {
      const t = setup();
      const job = await stubClaimed(t);
      const reason = { code: "too_dark", en: "The video is too dark." };
      await expectForbidden(t, { assessmentId: job.assessmentId, attempt: 1, outcome: "reshoot", reason }, job.assessmentId);
    });

    it("for an error on a stub-claimed row", async () => {
      const t = setup();
      const job = await stubClaimed(t);
      await expectForbidden(t, { assessmentId: job.assessmentId, attempt: 1, outcome: "error", errorCode: "x" }, job.assessmentId);
    });

    it("before the stale check: a stale stub result is 403, not 409", async () => {
      const t = setup();
      const job = await claimed(t);
      await expectForbidden(t, resultBody(job, { model: "stub-v1", attempt: 7 }), job.assessmentId);
    });

    it("still returns 401 first for a bad secret", async () => {
      const t = setup();
      const job = await claimed(t);
      expect((await post(t, "/ai/callback", resultBody(job, { model: "stub-v1" }), "Bearer wrong")).status).toBe(401);
    });

    it("accepts the same stub result, reshoot and error when AI_STUB_ENABLED is 1", async () => {
      vi.stubEnv("AI_STUB_ENABLED", "1");
      const t = setup();
      const a = await claimed(t, {}, "stub-laptop");
      const res = await post(t, "/ai/callback", resultBody(a, { model: "stub-v1" }));
      expect(res.status).toBe(200);
      expect(await get(t, a.assessmentId)).toMatchObject({ status: "awaiting_review", model: "stub-v1" });

      const b = await claimed(t, {}, "stub-laptop");
      const reason = { code: "too_dark", en: "The video is too dark." };
      expect((await post(t, "/ai/callback", { assessmentId: b.assessmentId, attempt: 1, outcome: "reshoot", reason })).status).toBe(200);

      const c = await claimed(t, {}, "stub-laptop");
      const err = await post(t, "/ai/callback", { assessmentId: c.assessmentId, attempt: 1, outcome: "error", errorCode: "x" });
      expect(await err.json()).toEqual({ status: "queued" });
    });

    it.each([
      ["unset", undefined],
      ["1", "1"],
    ])("never affects a non-stub worker and model (flag %s)", async (_label, flag) => {
      vi.stubEnv("AI_STUB_ENABLED", flag);
      const t = setup();
      const job = await claimed(t, {}, "brev-a100");
      const res = await post(t, "/ai/callback", resultBody(job, { model: "nvidia/Cosmos-Reason2-8B-stubby" }));
      expect(res.status).toBe(200);
    });
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
    // F3: an inherited-only key (conforms uses Object.hasOwn, not `in`).
    ["a body with a toString key", (j: Awaited<ReturnType<typeof claimed>>) => ({ ...resultBody(j), toString: "x" })],
    ["a body with a constructor key", (j: Awaited<ReturnType<typeof claimed>>) => ({ ...resultBody(j), constructor: "x" })],
  ])("returns 400 for %s and leaves the Assessment analyzing", async (_label, make) => {
    const t = setup();
    const job = await claimed(t);
    expect((await post(t, "/ai/callback", make(job))).status).toBe(400);
    expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
  });

  it("returns 400 duplicate_item for a repeated itemId, even when every result is yes (F1)", async () => {
    const t = setup();
    const job = await claimed(t);
    const body = resultBody(job, { observations: [...resultBody(job).observations, resultBody(job).observations[0]] });
    const res = await post(t, "/ai/callback", body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "duplicate_item" });
    expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
  });

  it("fills a Rubric item with no Observation as unclear before storing (F2, spec §6 rule 2)", async () => {
    const t = setup();
    const job = await claimed(t);
    const [first, ...rest] = job.rubric.items;
    const body = resultBody(job, { observations: rest.map((i) => ({ itemId: i.id, result: "yes", evidence: "seen", timestampS: 3 })) });
    const res = await post(t, "/ai/callback", body);
    expect(res.status).toBe(200);
    const row = (await get(t, job.assessmentId))!;
    expect(row.observations).toContainEqual({ itemId: first.id, result: "unclear", evidence: "", timestampS: 0 });
    if (first.safety) {
      expect(row.safetyFlags).toContain(first.id);
    }
  });

  describe("out-of-range results return 400 out_of_range and change nothing (F4)", () => {
    it.each([
      ["confidence above 1", (j: Awaited<ReturnType<typeof claimed>>) => resultBody(j, { verdict: { ...resultBody(j).verdict, confidence: 1.5 } })],
      ["a negative latencyMs", (j: Awaited<ReturnType<typeof claimed>>) => resultBody(j, { latencyMs: -1 })],
      ["a negative timestampS", (j: Awaited<ReturnType<typeof claimed>>) =>
        resultBody(j, { observations: resultBody(j).observations.map((o, i) => (i === 0 ? { ...o, timestampS: -1 } : o)) })],
      ["too many strengths", (j: Awaited<ReturnType<typeof claimed>>) =>
        resultBody(j, { verdict: { ...resultBody(j).verdict, strengths: Array(21).fill("x") } })],
      ["too long feedbackEn", (j: Awaited<ReturnType<typeof claimed>>) =>
        resultBody(j, { verdict: { ...resultBody(j).verdict, feedbackEn: "x".repeat(2001) } })],
      ["too long model", (j: Awaited<ReturnType<typeof claimed>>) => resultBody(j, { model: "x".repeat(201) })],
      ["a safetyFlags id not in the Rubric", (j: Awaited<ReturnType<typeof claimed>>) => resultBody(j, { safetyFlags: ["made-up"] })],
    ])("returns 400 out_of_range for %s", async (_label, make) => {
      const t = setup();
      const job = await claimed(t);
      const res = await post(t, "/ai/callback", make(job));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "out_of_range" });
      expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
    });

    it("returns 400 out_of_range for an errorCode over the cap", async () => {
      const t = setup();
      const job = await claimed(t);
      const res = await post(t, "/ai/callback", { assessmentId: job.assessmentId, attempt: 1, outcome: "error", errorCode: "x".repeat(201) });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "out_of_range" });
      expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
    });
  });

  describe("F7: more stale and missing-reference cases", () => {
    it("returns 409 for a result callback with a future attempt", async () => {
      const t = setup();
      const job = await claimed(t);
      const res = await post(t, "/ai/callback", resultBody(job, { attempt: job.attempt + 1 }));
      expect(res.status).toBe(409);
      expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
    });

    it("returns 409 for a reshoot callback with a future attempt", async () => {
      const t = setup();
      const job = await claimed(t);
      const reason = { code: "too_dark", en: "The video is too dark." };
      const res = await post(t, "/ai/callback", { assessmentId: job.assessmentId, attempt: job.attempt + 1, outcome: "reshoot", reason });
      expect(res.status).toBe(409);
      expect((await get(t, job.assessmentId))!.status).toBe("analyzing");
    });

    it("returns 409 for a reshoot callback after the Assessment already left analyzing (stale reshoot)", async () => {
      const t = setup();
      const job = await claimed(t);
      await post(t, "/ai/callback", resultBody(job));
      const reason = { code: "too_dark", en: "The video is too dark." };
      const res = await post(t, "/ai/callback", { assessmentId: job.assessmentId, attempt: job.attempt, outcome: "reshoot", reason });
      expect(res.status).toBe(409);
      expect((await get(t, job.assessmentId))!.status).toBe("awaiting_review");
    });

    it("returns 409 for an error callback after the cron already marked the Assessment failed", async () => {
      const t = setup();
      const now = Date.now();
      const id = await queued(t, { status: "analyzing", attempts: MAX_ATTEMPTS, claimedAt: now - 11 * 60 * 1000, claimedBy: "w1" });
      expect(await t.mutation(internal.aiJobs.requeueStale, {})).toEqual({ requeued: 0, failed: 1 });
      expect((await get(t, id))!.status).toBe("failed");
      const res = await post(t, "/ai/callback", { assessmentId: id, attempt: MAX_ATTEMPTS, outcome: "error", errorCode: "late" });
      expect(res.status).toBe(409);
      expect((await get(t, id))!.status).toBe("failed");
    });

    it("claim fails a row with a missing Rubric and one with a missing Trade, then claims the next", async () => {
      const t = setup();
      const privateRubricId = await t.run((ctx) =>
        ctx.db.insert("rubrics", { tradeSlug: "electrical", taskSlug: "temp", taskName: "Temp", version: 999, items: [], status: "active" }),
      );
      const noRubric = await queued(t, { rubricId: privateRubricId });
      await t.run((ctx) => ctx.db.delete("rubrics", privateRubricId));
      const noTrade = await queued(t, { tradeSlug: "does-not-exist" });
      const good = await queued(t);

      const job = await (await post(t, "/ai/claim", { workerId: "w1" })).json();
      expect(job.assessmentId).toBe(good);
      expect(await get(t, noRubric)).toMatchObject({ status: "failed", attempts: 1 });
      expect(await get(t, noTrade)).toMatchObject({ status: "failed", attempts: 1 });
    });
  });
});

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
