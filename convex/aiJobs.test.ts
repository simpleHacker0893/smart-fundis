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
