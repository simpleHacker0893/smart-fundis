import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { canDecide, type DecideRefusal } from "./lib/auth";
import schema from "./schema";
import { modules } from "./test.setup";

// The Expert queue and decision (#41): US-5.1, US-5.3, US-5.4, US-2.8.

function identity(name: string, email = `${name}@example.com`) {
  return {
    tokenIdentifier: `https://clerk.example|user_${name}`,
    subject: `user_${name}`,
    issuer: "https://clerk.example",
    email,
    emailVerified: true,
    name,
  };
}
type Identity = ReturnType<typeof identity>;

const WANJIRU = identity("wanjiru"); // a Fundi (Electrical, Hairdressing)
const OTIENO = identity("otieno"); // another Fundi
const AMINA = identity("amina"); // an Expert for Electrical

const SOCKET = { tradeSlug: "electrical", taskSlug: "13a-socket", consentVersion: "consent-v1" };
const CORNROWS = { tradeSlug: "hairdressing", taskSlug: "cornrows", consentVersion: "consent-v1" };

let t: TestConvex<typeof schema>;

beforeEach(async () => {
  t = convexTest(schema, modules);
  await t.mutation(internal.seed.trades, {});
});

async function userId(who: Identity): Promise<Id<"users">> {
  const row = await t.run((ctx) =>
    ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", who.tokenIdentifier))
      .unique(),
  );
  if (row === null) throw new Error(`no users row for ${who.name}`);
  return row._id;
}

/** Signs the identity in (users.store) and gives them a Fundi profile. */
async function makeFundi(who: Identity, tradeSlugs = ["electrical", "hairdressing"]) {
  await t.withIdentity(who).mutation(api.users.store, {});
  await t.withIdentity(who).mutation(api.fundiProfiles.create, {
    name: who.name,
    phone: "0712 345 678",
    tradeSlugs,
    county: "Nairobi",
  });
}

/** Signs the identity in and makes them an Expert (the Admin approval is V4). */
async function makeExpert(who: Identity, approvedTrades = ["electrical"], active = true) {
  await t.withIdentity(who).mutation(api.users.store, {});
  const id = await userId(who);
  await t.run(async (ctx) => {
    await ctx.db.insert("experts", { userId: id, approvedTrades, active });
  });
}

async function storeVideo() {
  return await t.run(async (ctx) => {
    const id = await ctx.storage.store(new Blob(["not really a video"]));
    const system = ctx.db as unknown as {
      patch(id: Id<"_storage">, value: Record<string, unknown>): Promise<void>;
    };
    await system.patch(id, { size: 1024, contentType: "video/mp4" });
    return id;
  });
}

/** Uploads a video as the Fundi (assessments.create); returns the queued Assessment. */
async function upload(who: Identity, task: typeof SOCKET | typeof CORNROWS = SOCKET) {
  const as = t.withIdentity(who);
  const livenessCode = await as.mutation(api.assessments.newLivenessCode, {});
  const result = await as.mutation(api.assessments.create, {
    ...task,
    storageId: await storeVideo(),
    livenessCode,
    ...(task === CORNROWS ? { clientConsent: true } : {}),
  });
  if (!result.ok) throw new Error(`upload failed: ${result.code}`);
  return result.assessmentId;
}

/** Puts an Assessment where the AI callback leaves it: awaiting_review, with a result. */
async function aiDone(id: Id<"assessments">) {
  await t.run(async (ctx) => {
    const row = await ctx.db.get("assessments", id);
    if (row === null) throw new Error("no assessment");
    const rubric = await ctx.db.get("rubrics", row.rubricId);
    const items = rubric?.items ?? [];
    await ctx.db.patch("assessments", id, {
      status: "awaiting_review",
      attempts: 1,
      observations: items.map((item, i) => ({
        itemId: item.id,
        result: "yes" as const,
        evidence: `Step ${i + 1} seen.`,
        timestampS: i * 5,
      })),
      verdict: "needs_review",
      confidence: 0.7,
      strengths: ["Neat wiring"],
      gaps: ["Test the socket"],
      safetyFlags: items.filter((i) => i.safety).slice(0, 1).map((i) => i.id),
      livenessRead: row.livenessCode,
      livenessCheck: "yes",
      feedbackEn: "Good work.",
      model: "stub",
      latencyMs: 10,
      fallbackModel: false,
    });
  });
}

/** An awaiting_review Assessment by the Fundi. */
async function awaiting(who: Identity, task: typeof SOCKET | typeof CORNROWS = SOCKET) {
  const id = await upload(who, task);
  await aiDone(id);
  return id;
}

describe("reviews.queue", () => {
  it("lists awaiting_review Assessments in the Expert's approved Trades, oldest first, with the AI recommendation", async () => {
    await makeFundi(WANJIRU);
    await makeFundi(OTIENO);
    await makeExpert(AMINA, ["electrical"]);
    const first = await awaiting(WANJIRU);
    await awaiting(OTIENO, CORNROWS); // another Trade
    await upload(OTIENO); // still queued
    const second = await awaiting(OTIENO);

    const queue = await t.withIdentity(AMINA).query(api.reviews.queue, {});
    expect(queue.map((row) => row.assessmentId)).toEqual([first, second]);
    expect(queue[0]).toMatchObject({
      tradeSlug: "electrical",
      tradeName: "Electrical",
      taskSlug: "13a-socket",
      taskName: "Install a 13A socket",
      verdict: "needs_review",
      safetyFlagCount: 1,
    });
    expect(queue[0]._creationTime).toBeLessThan(queue[1]._creationTime);
    // A list row carries no video and no phone.
    for (const row of queue) {
      expect(row).not.toHaveProperty("videoUrl");
      expect(row).not.toHaveProperty("videoStorageId");
      expect(row).not.toHaveProperty("phone");
    }
  });

  it("merges every approved Trade oldest first, and skips the Expert's own Assessments", async () => {
    await makeFundi(WANJIRU);
    await makeFundi(AMINA); // AMINA is a Fundi and an Expert
    await makeExpert(AMINA, ["electrical", "hairdressing"]);
    const a = await awaiting(WANJIRU);
    await awaiting(AMINA); // her own: never in her queue
    const b = await awaiting(WANJIRU, CORNROWS);
    await awaiting(AMINA, CORNROWS);
    const c = await awaiting(WANJIRU);

    const queue = await t.withIdentity(AMINA).query(api.reviews.queue, {});
    expect(queue.map((row) => row.assessmentId)).toEqual([a, b, c]);
  });

  it("never lists a Demo Fundi's Assessment", async () => {
    await makeFundi(WANJIRU);
    await makeFundi(OTIENO);
    await makeExpert(AMINA);
    const real = await awaiting(WANJIRU);
    await awaiting(OTIENO);
    const otieno = await userId(OTIENO);
    await t.run((ctx) => ctx.db.patch("users", otieno, { isDemo: true }));

    const queue = await t.withIdentity(AMINA).query(api.reviews.queue, {});
    expect(queue.map((row) => row.assessmentId)).toEqual([real]);
  });

  it("refuses a signed-out caller, a User who is not an Expert, and an inactive Expert", async () => {
    await expect(t.query(api.reviews.queue, {})).rejects.toThrowError(/not authenticated/i);
    await makeFundi(WANJIRU);
    await expect(t.withIdentity(WANJIRU).query(api.reviews.queue, {})).rejects.toThrowError(
      /active Expert is required/i,
    );
    await makeExpert(AMINA, ["electrical"], false);
    await expect(t.withIdentity(AMINA).query(api.reviews.queue, {})).rejects.toThrowError(
      /active Expert is required/i,
    );
  });
});

describe("reviews.detail", () => {
  it("gives an eligible Expert the Rubric, the AI result and the signed video URL", async () => {
    await makeFundi(WANJIRU);
    await makeExpert(AMINA);
    const id = await awaiting(WANJIRU);

    const detail = await t.withIdentity(AMINA).query(api.reviews.detail, { assessmentId: id });
    expect(detail).toMatchObject({
      _id: id,
      status: "awaiting_review",
      tradeSlug: "electrical",
      tradeName: "Electrical",
      taskSlug: "13a-socket",
      taskName: "Install a 13A socket",
      verdict: "needs_review",
      confidence: 0.7,
      strengths: ["Neat wiring"],
      gaps: ["Test the socket"],
      livenessCheck: "yes",
      feedbackEn: "Good work.",
      fallbackModel: false,
    });
    expect(detail?.videoUrl).toMatch(/^https:\/\//);
    expect(detail?.rubricItems.length).toBeGreaterThan(0);
    expect(detail?.observations).toHaveLength(detail?.rubricItems.length ?? -1);
    expect(detail?.safetyFlags).toHaveLength(1);
    expect(detail?.livenessCode).toMatch(/^[0-9]{3}$/);
    expect(detail?.livenessRead).toBe(detail?.livenessCode);
    expect(detail).not.toHaveProperty("phone");
    expect(detail).not.toHaveProperty("fundiUserId");
  });

  it("returns a null video URL once the video is deleted", async () => {
    await makeFundi(WANJIRU);
    await makeExpert(AMINA);
    const id = await awaiting(WANJIRU);
    await t.run(async (ctx) => {
      const row = await ctx.db.get("assessments", id);
      if (row?.videoStorageId) await ctx.storage.delete(row.videoStorageId);
      await ctx.db.patch("assessments", id, { videoStorageId: undefined, videoDeletedAt: Date.now() });
    });
    const detail = await t.withIdentity(AMINA).query(api.reviews.detail, { assessmentId: id });
    expect(detail?.videoUrl).toBeNull();
  });

  it("returns null for a missing Assessment and refuses a signed-out caller", async () => {
    await makeFundi(WANJIRU);
    await makeExpert(AMINA);
    const id = await awaiting(WANJIRU);
    await expect(t.query(api.reviews.detail, { assessmentId: id })).rejects.toThrowError(
      /not authenticated/i,
    );
    await t.run((ctx) => ctx.db.delete("assessments", id));
    expect(await t.withIdentity(AMINA).query(api.reviews.detail, { assessmentId: id })).toBeNull();
  });
});

// Each canDecide refusal (spec §4, US-2.8), seen through reviews.detail
// (null, no video) and reviews.decide (forbidden, nothing written).
describe("canDecide", () => {
  async function refused(who: Identity, id: Id<"assessments">, code: DecideRefusal) {
    expect(await t.withIdentity(who).query(api.reviews.detail, { assessmentId: id })).toBeNull();
    const decider = await userId(who);
    const result = await t.run(async (ctx) => {
      const row = await ctx.db.get("assessments", id);
      if (row === null) throw new Error("no assessment");
      return await canDecide(ctx, decider, row);
    });
    expect(result).toEqual({ ok: false, code });
  }

  it("refuses an Expert their own Assessment", async () => {
    await makeFundi(AMINA);
    await makeExpert(AMINA);
    await refused(AMINA, await awaiting(AMINA), "own_assessment");
  });

  it("refuses an Admin who is also an Expert their own Assessment", async () => {
    vi.stubEnv("ADMIN_EMAILS", AMINA.email);
    try {
      await makeFundi(AMINA);
      await makeExpert(AMINA);
      const roles = await t.withIdentity(AMINA).query(api.users.me, {});
      expect(roles?.roles).toMatchObject({ admin: true, expert: true, base: "fundi" });
      await refused(AMINA, await awaiting(AMINA), "own_assessment");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("refuses an Expert not approved for the Assessment's Trade", async () => {
    await makeFundi(WANJIRU);
    await makeExpert(AMINA, ["hairdressing"]);
    await refused(AMINA, await awaiting(WANJIRU), "not_approved_for_trade");
  });

  it("refuses an inactive Expert", async () => {
    await makeFundi(WANJIRU);
    await makeExpert(AMINA, ["electrical"], false);
    await refused(AMINA, await awaiting(WANJIRU), "not_expert");
  });

  it("refuses a User who is not an Expert, including the Assessment's own Fundi", async () => {
    await makeFundi(WANJIRU);
    await makeFundi(OTIENO);
    const id = await awaiting(WANJIRU);
    await refused(OTIENO, id, "not_expert");
    await refused(WANJIRU, id, "own_assessment");
  });

  it("refuses, on an appealed Assessment, the Expert who made the original decision", async () => {
    const BARAKA = identity("baraka");
    await makeFundi(WANJIRU);
    await makeExpert(AMINA);
    await makeExpert(BARAKA);
    const id = await awaiting(WANJIRU);
    const amina = await userId(AMINA);
    // Appeals are V4: set up a rejected-then-appealed Assessment directly.
    await t.run(async (ctx) => {
      await ctx.db.insert("reviews", {
        assessmentId: id,
        deciderUserId: amina,
        kind: "review",
        decision: "reject",
        note: "The socket was not tested.",
        at: Date.now(),
      });
      await ctx.db.patch("assessments", id, { status: "appealed", appealReason: "I did test it." });
    });
    await refused(AMINA, id, "original_decider");
    const detail = await t.withIdentity(BARAKA).query(api.reviews.detail, { assessmentId: id });
    expect(detail?.status).toBe("appealed");
  });
});
