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
