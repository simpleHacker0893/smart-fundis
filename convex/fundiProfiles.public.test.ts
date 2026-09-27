import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

// fundiProfiles.getPublic: the reader behind the public /f/[id] page (#42,
// US-5.7). No sign-in; it must show only what the spec §4 public profile
// allows, and a Badge only for an Expert-approved Assessment.

let t: TestConvex<typeof schema>;

beforeEach(async () => {
  t = convexTest(schema, modules);
  await t.mutation(internal.seed.trades, {});
});

const PHONE = "+254712345678";
const EMAIL = "wanjiru.private@example.com";

/** A Fundi with a users row and a Listed profile; returns both ids. */
async function makeFundi(opts: { publicListing?: boolean; trades?: string[] } = {}) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      clerkId: "https://clerk.example|user_wanjiru",
      email: EMAIL,
      name: "Wanjiru Kamau",
      phone: PHONE,
      county: "Nairobi",
    });
    const profileId = await ctx.db.insert("fundiProfiles", {
      userId,
      trades: opts.trades ?? ["electrical", "hairdressing"],
      county: "Nairobi",
      publicListing: opts.publicListing ?? true,
      bio: "Private bio text",
      links: { youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    return { userId, profileId };
  });
}

type Status = "queued" | "awaiting_review" | "approved" | "reshoot" | "rejected";

/**
 * An Assessment of the Fundi with the full AI output, Liveness and a video;
 * with `decided`, also an Expert reviews row with a note.
 */
async function assessment(
  fundiUserId: Id<"users">,
  status: Status,
  tag: string,
  decided?: { decision: "approve" | "reshoot" | "reject"; at: number },
) {
  return await t.run(async (ctx) => {
    const trade = await ctx.db
      .query("trades")
      .withIndex("by_slug", (q) => q.eq("slug", "electrical"))
      .unique();
    if (!trade?.activeRubricId) throw new Error("electrical has no active Rubric");
    const videoStorageId = await ctx.storage.store(new Blob(["video"]));
    const id = await ctx.db.insert("assessments", {
      fundiUserId,
      tradeSlug: "electrical",
      rubricId: trade.activeRubricId,
      consentVersion: "consent-v1",
      consentAt: 1,
      videoStorageId,
      clipName: `clip-${tag}.mp4`,
      livenessCode: `LIVE-${tag}`,
      livenessRead: `LIVE-${tag}`,
      livenessCheck: "yes",
      status,
      attempts: 1,
      observations: [{ itemId: "i1", result: "no", evidence: `EVIDENCE-${tag}`, timestampS: 3 }],
      verdict: status === "approved" ? "pass" : "needs_review",
      confidence: 0.77,
      strengths: [`STRENGTH-${tag}`],
      gaps: [`GAP-${tag}`],
      safetyFlags: [`SAFETY-${tag}`],
      feedbackEn: `FEEDBACK-${tag}`,
      model: "stub",
      latencyMs: 10,
      licenseStatus: "none",
    });
    if (decided) {
      const expertId = await ctx.db.insert("users", {
        clerkId: `https://clerk.example|expert_${tag}`,
        email: `expert-${tag}@example.com`,
        name: `Expert ${tag}`,
      });
      await ctx.db.insert("reviews", {
        assessmentId: id,
        deciderUserId: expertId,
        kind: "review",
        decision: decided.decision,
        note: `NOTE-${tag}`,
        at: decided.at,
      });
    }
    return id;
  });
}

describe("fundiProfiles.getPublic", () => {
  it("returns the name, county and declared Trades of a Listed Fundi, signed out", async () => {
    const { profileId } = await makeFundi();
    const result = await t.query(api.fundiProfiles.getPublic, { id: profileId });
    expect(result).toEqual({
      id: profileId,
      name: "Wanjiru Kamau",
      county: "Nairobi",
      isDemo: false,
      trades: [
        { slug: "electrical", name: "Electrical" },
        { slug: "hairdressing", name: "Hairdressing" },
      ],
      badges: [],
    });
  });

  it("returns null for an unknown id, a garbage id and another table's id", async () => {
    const { userId, profileId } = await makeFundi();
    await t.run(async (ctx) => {
      await ctx.db.delete("fundiProfiles", profileId);
    });
    expect(await t.query(api.fundiProfiles.getPublic, { id: profileId })).toBeNull();
    expect(await t.query(api.fundiProfiles.getPublic, { id: "not-an-id" })).toBeNull();
    expect(await t.query(api.fundiProfiles.getPublic, { id: "" })).toBeNull();
    expect(await t.query(api.fundiProfiles.getPublic, { id: userId })).toBeNull();
  });

  it("returns null when the Fundi is not Listed (publicListing off)", async () => {
    const { profileId } = await makeFundi({ publicListing: false });
    expect(await t.query(api.fundiProfiles.getPublic, { id: profileId })).toBeNull();
  });

  it("tags a Demo profile", async () => {
    const { userId, profileId } = await makeFundi();
    await t.run(async (ctx) => {
      await ctx.db.patch("users", userId, { isDemo: true });
    });
    expect(await t.query(api.fundiProfiles.getPublic, { id: profileId })).toMatchObject({ isDemo: true });
  });

  it("leaks nothing but the approved Badge (US-5.7 leak test)", async () => {
    const { userId, profileId } = await makeFundi();
    await assessment(userId, "approved", "APPROVED", { decision: "approve", at: 1_700_000_000_000 });
    await assessment(userId, "awaiting_review", "WAITING");
    await assessment(userId, "rejected", "REJECTED", { decision: "reject", at: 1_700_000_100_000 });
    await assessment(userId, "reshoot", "RESHOOT", { decision: "reshoot", at: 1_700_000_200_000 });
    await assessment(userId, "queued", "QUEUED");

    const result = await t.query(api.fundiProfiles.getPublic, { id: profileId });
    expect(result?.badges).toEqual([
      {
        tradeSlug: "electrical",
        tradeName: "Electrical",
        taskSlug: "13a-socket",
        taskName: expect.any(String),
        decidedAt: 1_700_000_000_000,
      },
    ]);

    const json = JSON.stringify(result);
    const forbidden = [
      PHONE,
      "712345678",
      EMAIL,
      "@",
      userId,
      "clerk",
      "videoUrl",
      "storage",
      "clip",
      "LIVE-",
      "EVIDENCE-",
      "STRENGTH-",
      "GAP-",
      "SAFETY-",
      "FEEDBACK-",
      "NOTE-",
      "Expert ",
      "Private bio",
      "youtube",
      "observations",
      "verdict",
      "confidence",
      "needs_review",
      "pass",
      "fail",
      "awaiting_review",
      "rejected",
      "reshoot",
      "queued",
      "WAITING",
      "REJECTED",
      "RESHOOT",
      "QUEUED",
      "0.77",
      "stub",
      "certified",
    ];
    for (const word of forbidden) {
      expect(json, `the result contains "${word}"`).not.toContain(word);
    }
    expect(json.toLowerCase()).not.toContain("certified");
  });

  it("gives no Badge for an approved Assessment no Expert review decided", async () => {
    const { userId, profileId } = await makeFundi();
    await assessment(userId, "approved", "NOREVIEW");
    const result = await t.query(api.fundiProfiles.getPublic, { id: profileId });
    expect(result?.badges).toEqual([]);
  });

  it("dates a Badge by its latest reviews row, the same as listMine, newest decision first", async () => {
    const { userId, profileId } = await makeFundi();
    const first = await assessment(userId, "approved", "FIRST", { decision: "approve", at: 1_000 });
    await assessment(userId, "approved", "SECOND", { decision: "approve", at: 5_000 });
    // An appeal later re-approved the first one: its latest row is the date.
    await t.run(async (ctx) => {
      const expertId = await ctx.db.insert("users", { clerkId: "x|appeal", email: "a@example.com", name: "A" });
      await ctx.db.insert("reviews", {
        assessmentId: first,
        deciderUserId: expertId,
        kind: "appeal",
        decision: "approve",
        at: 9_000,
      });
    });
    const result = await t.query(api.fundiProfiles.getPublic, { id: profileId });
    expect(result?.badges.map((b) => b.decidedAt)).toEqual([9_000, 5_000]);
  });

  it("shows only this Fundi's Badges", async () => {
    const { profileId } = await makeFundi();
    const otherId = await t.run((ctx) =>
      ctx.db.insert("users", { clerkId: "x|other", email: "o@example.com", name: "Other" }),
    );
    await assessment(otherId, "approved", "OTHER", { decision: "approve", at: 2_000 });
    const result = await t.query(api.fundiProfiles.getPublic, { id: profileId });
    expect(result?.badges).toEqual([]);
  });
});
