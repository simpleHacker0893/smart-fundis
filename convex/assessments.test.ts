import { convexTest, type TestConvex } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { checkVideoFile, pickLivenessCode } from "./lib/assessmentUpload";
import { isStorageReferenced } from "./lib/storage";
import { modules } from "./test.setup";

// The upload flow (#38): US-3.2, 3.4, 3.7, 3.9, 3.1/4.1.

const WANJIRU = {
  tokenIdentifier: "https://clerk.example|user_wanjiru",
  subject: "user_wanjiru",
  issuer: "https://clerk.example",
  email: "wanjiru@example.com",
  emailVerified: true,
  name: "Wanjiru Kamau",
};

const OTIENO = {
  tokenIdentifier: "https://clerk.example|user_otieno",
  subject: "user_otieno",
  issuer: "https://clerk.example",
  email: "otieno@example.com",
  emailVerified: true,
  name: "Otieno Ouma",
};

let t: TestConvex<typeof schema>;

beforeEach(async () => {
  t = convexTest(schema, modules);
  await t.mutation(internal.seed.trades, {});
});

/** Signs the identity in (users.store) and gives them a Fundi profile. */
async function makeFundi(identity: typeof WANJIRU, tradeSlugs = ["electrical"]) {
  await t.withIdentity(identity).mutation(api.users.store, {});
  await t.withIdentity(identity).mutation(api.fundiProfiles.create, {
    name: identity.name,
    phone: "0712 345 678",
    tradeSlugs,
    county: "Nairobi",
  });
}

describe("assessments.generateUploadUrl", () => {
  it("returns an upload URL for a Fundi", async () => {
    await makeFundi(WANJIRU);
    const url = await t.withIdentity(WANJIRU).mutation(api.assessments.generateUploadUrl, {});
    expect(url).toMatch(/^https:\/\//);
  });

  it("refuses a signed-out caller and a User who is not a Fundi", async () => {
    await expect(t.mutation(api.assessments.generateUploadUrl, {})).rejects.toThrowError(
      /not authenticated/i,
    );
    await t.withIdentity(OTIENO).mutation(api.users.store, {});
    await expect(
      t.withIdentity(OTIENO).mutation(api.assessments.generateUploadUrl, {}),
    ).rejects.toThrowError(/fundi profile is required/i);
  });
});

describe("assessments.newLivenessCode", () => {
  it("issues a 3-digit code, replaces it on each call, and never repeats the last one", async () => {
    await makeFundi(WANJIRU);
    const as = t.withIdentity(WANJIRU);
    expect(await as.query(api.assessments.currentLivenessCode, {})).toBeNull();

    const seen: string[] = [];
    for (let i = 0; i < 20; i++) {
      const code = await as.mutation(api.assessments.newLivenessCode, {});
      expect(code).toMatch(/^[0-9]{3}$/);
      if (seen.length > 0) expect(code).not.toBe(seen[seen.length - 1]);
      seen.push(code);
      expect(await as.query(api.assessments.currentLivenessCode, {})).toMatchObject({ code });
    }
    const rows = await t.run((ctx) => ctx.db.query("livenessCodes").take(10));
    expect(rows).toHaveLength(1);
  });

  it("refuses a signed-out caller and a User who is not a Fundi", async () => {
    await expect(t.mutation(api.assessments.newLivenessCode, {})).rejects.toThrowError(
      /not authenticated/i,
    );
    await t.withIdentity(OTIENO).mutation(api.users.store, {});
    await expect(
      t.withIdentity(OTIENO).mutation(api.assessments.newLivenessCode, {}),
    ).rejects.toThrowError(/fundi profile is required/i);
    await expect(
      t.withIdentity(OTIENO).query(api.assessments.currentLivenessCode, {}),
    ).rejects.toThrowError(/fundi profile is required/i);
  });
});

const MB = 1024 * 1024;

/**
 * Stores a stand-in video and sets the `_storage` metadata the real backend
 * would record for the upload. convex-test records neither the Content-Type
 * header nor a real size, and a 100 MB blob would be slow, so the test patches
 * the system row directly (only possible from t.run, never from a function).
 */
async function storeVideo(meta: { size?: number; contentType?: string | null } = {}) {
  return await t.run(async (ctx) => {
    const id = await ctx.storage.store(new Blob(["not really a video"]));
    const system = ctx.db as unknown as {
      patch(id: Id<"_storage">, value: Record<string, unknown>): Promise<void>;
    };
    await system.patch(id, {
      size: meta.size ?? 12 * MB,
      contentType: meta.contentType === null ? undefined : (meta.contentType ?? "video/mp4"),
    });
    return id;
  });
}

async function fileExists(id: Id<"_storage">) {
  return (await t.run((ctx) => ctx.db.system.get("_storage", id))) !== null;
}

async function assessments() {
  return await t.run((ctx) => ctx.db.query("assessments").take(100));
}

const SOCKET = { tradeSlug: "electrical", taskSlug: "13a-socket", consentVersion: "consent-v1" };
const CORNROWS = { tradeSlug: "hairdressing", taskSlug: "cornrows", consentVersion: "consent-v1" };

/** A Fundi who has been shown a Liveness code; returns the code. */
async function readyFundi(identity = WANJIRU) {
  await makeFundi(identity, ["electrical", "hairdressing"]);
  return await t.withIdentity(identity).mutation(api.assessments.newLivenessCode, {});
}

describe("assessments.create", () => {
  it("records a valid upload as a queued Assessment with the consent and the issued Liveness code", async () => {
    const code = await readyFundi();
    const storageId = await storeVideo();
    const before = Date.now();

    const result = await t
      .withIdentity(WANJIRU)
      .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: code });

    expect(result.ok).toBe(true);
    const trade = await t.run((ctx) =>
      ctx.db.query("trades").withIndex("by_slug", (q) => q.eq("slug", "electrical")).unique(),
    );
    const rows = await assessments();
    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(result).toEqual({ ok: true, assessmentId: row._id });
    expect(row).toMatchObject({
      tradeSlug: "electrical",
      rubricId: trade?.activeRubricId,
      videoStorageId: storageId,
      livenessCode: code,
      consentVersion: "consent-v1",
      status: "queued",
      attempts: 0,
      licenseStatus: "none",
    });
    expect(row.consentAt).toBeGreaterThanOrEqual(before);
    expect(row.clientConsent).toBeUndefined();
    expect(await fileExists(storageId)).toBe(true);
    // The code is used up: the next Assessment needs a new one.
    expect(await t.withIdentity(WANJIRU).query(api.assessments.currentLivenessCode, {})).toBeNull();
  });

  it("stores the client's agreement for a Task where a client is on camera", async () => {
    const code = await readyFundi();
    const storageId = await storeVideo({ contentType: "video/quicktime" });
    const result = await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
      ...CORNROWS,
      storageId,
      livenessCode: code,
      clientConsent: true,
    });
    expect(result.ok).toBe(true);
    expect(await assessments()).toMatchObject([{ tradeSlug: "hairdressing", clientConsent: true }]);
  });

  it("accepts a file of exactly 100 MB", async () => {
    const code = await readyFundi();
    const storageId = await storeVideo({ size: 100 * MB });
    const result = await t
      .withIdentity(WANJIRU)
      .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: code });
    expect(result.ok).toBe(true);
  });

  type Case = {
    name: string;
    code: string;
    file?: { size?: number; contentType?: string | null };
    args?: Record<string, unknown>;
  };
  const cases: Case[] = [
    { name: "an oversize file", code: "too_large", file: { size: 100 * MB + 1 } },
    { name: "a wrong type", code: "wrong_type", file: { contentType: "image/png" } },
    { name: "a file with no type", code: "wrong_type", file: { contentType: null } },
    { name: "missing consent", code: "consent_missing", args: { consentVersion: undefined } },
    { name: "an old consent version", code: "consent_outdated", args: { consentVersion: "consent-v0" } },
    { name: "an unknown Task", code: "unknown_task", args: { taskSlug: "3-pin-plug" } },
    { name: "a Trade that is not Verify now", code: "unknown_task", args: { tradeSlug: "plumbing" } },
    { name: "a Liveness code the server did not issue", code: "liveness_mismatch", args: { livenessCode: "x" } },
    {
      name: "a missing client tick where a client is on camera",
      code: "client_consent_missing",
      args: { ...CORNROWS },
    },
    {
      name: "an unticked client box where a client is on camera",
      code: "client_consent_missing",
      args: { ...CORNROWS, clientConsent: false },
    },
  ];

  it.each(cases)("rejects $name, deletes the stored file and writes nothing", async (c) => {
    const code = await readyFundi();
    const storageId = await storeVideo(c.file);

    const result = await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
      ...SOCKET,
      storageId,
      livenessCode: code,
      ...c.args,
    } as never);

    expect(result).toEqual({ ok: false, code: c.code });
    expect(await fileExists(storageId)).toBe(false);
    expect(await assessments()).toHaveLength(0);
    // The Liveness code survives a rejection, so the Fundi can fix the file and retry.
    expect(await t.withIdentity(WANJIRU).query(api.assessments.currentLivenessCode, {})).toMatchObject({
      code,
    });
  });

  it("rejects a signed-out caller and deletes the stored file", async () => {
    const storageId = await storeVideo();
    const result = await t.mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: "123" });
    expect(result).toEqual({ ok: false, code: "not_signed_in" });
    expect(await fileExists(storageId)).toBe(false);
    expect(await assessments()).toHaveLength(0);
  });

  it("rejects a signed-in User who is not a Fundi, or has no users row, and deletes the stored file", async () => {
    const noRow = await storeVideo();
    expect(
      await t
        .withIdentity(OTIENO)
        .mutation(api.assessments.create, { ...SOCKET, storageId: noRow, livenessCode: "123" }),
    ).toEqual({ ok: false, code: "no_user" });
    expect(await fileExists(noRow)).toBe(false);

    await t.withIdentity(OTIENO).mutation(api.users.store, {});
    const notFundi = await storeVideo();
    expect(
      await t
        .withIdentity(OTIENO)
        .mutation(api.assessments.create, { ...SOCKET, storageId: notFundi, livenessCode: "123" }),
    ).toEqual({ ok: false, code: "not_fundi" });
    expect(await fileExists(notFundi)).toBe(false);
    expect(await assessments()).toHaveLength(0);
  });

  it("rejects an upload when no Liveness code was issued", async () => {
    await makeFundi(WANJIRU);
    const storageId = await storeVideo();
    const result = await t
      .withIdentity(WANJIRU)
      .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: "123" });
    expect(result).toEqual({ ok: false, code: "liveness_missing" });
    expect(await fileExists(storageId)).toBe(false);
  });

  it("rejects an expired Liveness code", async () => {
    const code = await readyFundi();
    await t.run(async (ctx) => {
      const row = await ctx.db.query("livenessCodes").first();
      if (row) await ctx.db.patch("livenessCodes", row._id, { issuedAt: row.issuedAt - 3 * 60 * 60 * 1000 });
    });
    const storageId = await storeVideo();
    const result = await t
      .withIdentity(WANJIRU)
      .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: code });
    expect(result).toEqual({ ok: false, code: "liveness_expired" });
    expect(await fileExists(storageId)).toBe(false);
  });

  it("never reuses or deletes a video that is already on an Assessment", async () => {
    const code = await readyFundi();
    const storageId = await storeVideo();
    await t.withIdentity(WANJIRU).mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: code });

    // Another Fundi, and a signed-out caller, try the same storageId.
    const otherCode = await readyFundi(OTIENO);
    expect(
      await t
        .withIdentity(OTIENO)
        .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: otherCode }),
    ).toEqual({ ok: false, code: "file_in_use" });
    expect(
      await t.mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: otherCode }),
    ).toEqual({ ok: false, code: "not_signed_in" });

    expect(await fileExists(storageId)).toBe(true);
    expect(await assessments()).toHaveLength(1);
  });

  describe("Fundi B sends Fundi A's storageId", () => {
    it("already on A's Assessment: not deleted, not reused, file_in_use", async () => {
      const codeA = await readyFundi(WANJIRU);
      const storageId = await storeVideo();
      const a = await t
        .withIdentity(WANJIRU)
        .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: codeA });
      expect(a.ok).toBe(true);

      const codeB = await readyFundi(OTIENO);
      expect(
        await t.withIdentity(OTIENO).mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: codeB }),
      ).toEqual({ ok: false, code: "file_in_use" });

      expect(await fileExists(storageId)).toBe(true);
      const rows = await assessments();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.videoStorageId).toBe(storageId);
      expect(a.ok && rows[0]?._id === a.assessmentId).toBe(true);
    });

    it("not yet recorded: B's rejected call deletes it, by design (a file has no owner until an Assessment records it; storageIds are unguessable)", async () => {
      await readyFundi(WANJIRU);
      const storageId = await storeVideo(); // A uploaded but has not called create yet.

      await readyFundi(OTIENO);
      expect(
        await t
          .withIdentity(OTIENO)
          .mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: "not-the-code" }),
      ).toEqual({ ok: false, code: "liveness_mismatch" });

      expect(await fileExists(storageId)).toBe(false);
      expect(await assessments()).toHaveLength(0);
    });
  });

  it("reports a storageId whose file is already gone", async () => {
    const code = await readyFundi();
    const storageId = await storeVideo();
    await t.run((ctx) => ctx.storage.delete(storageId));
    expect(
      await t.withIdentity(WANJIRU).mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: code }),
    ).toEqual({ ok: false, code: "file_missing" });
  });

  it("gives every Assessment a new Liveness code", async () => {
    const first = await readyFundi();
    await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
      ...SOCKET,
      storageId: await storeVideo(),
      livenessCode: first,
    });
    const second = await t.withIdentity(WANJIRU).mutation(api.assessments.newLivenessCode, {});
    await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
      ...SOCKET,
      storageId: await storeVideo(),
      livenessCode: second,
    });

    expect(second).not.toBe(first);
    const codes = (await assessments()).map((a) => a.livenessCode).sort();
    expect(codes).toEqual([first, second].sort());
  });

  it("links a new Assessment to the caller's reshoot or failed one, and to nothing else", async () => {
    const code = await readyFundi();
    await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
      ...SOCKET,
      storageId: await storeVideo(),
      livenessCode: code,
    });
    const [previous] = await assessments();

    // Still queued: not a reshoot yet.
    const next = await t.withIdentity(WANJIRU).mutation(api.assessments.newLivenessCode, {});
    const early = await storeVideo();
    expect(
      await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
        ...SOCKET,
        storageId: early,
        livenessCode: next,
        previousAssessmentId: previous._id,
      }),
    ).toEqual({ ok: false, code: "invalid_previous" });
    expect(await fileExists(early)).toBe(false);

    // Someone else's Assessment.
    await t.run((ctx) => ctx.db.patch("assessments", previous._id, { status: "reshoot" }));
    const otherCode = await readyFundi(OTIENO);
    expect(
      await t.withIdentity(OTIENO).mutation(api.assessments.create, {
        ...SOCKET,
        storageId: await storeVideo(),
        livenessCode: otherCode,
        previousAssessmentId: previous._id,
      }),
    ).toEqual({ ok: false, code: "invalid_previous" });

    const result = await t.withIdentity(WANJIRU).mutation(api.assessments.create, {
      ...SOCKET,
      storageId: await storeVideo(),
      livenessCode: next,
      previousAssessmentId: previous._id,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const row = await t.run((ctx) => ctx.db.get("assessments", result.assessmentId));
      expect(row?.previousAssessmentId).toBe(previous._id);
    }
  });
});

/** Uploads one valid video for the identity (already a Fundi) and returns the Assessment id. */
async function upload(identity: typeof WANJIRU, task: typeof SOCKET | typeof CORNROWS = SOCKET) {
  const as = t.withIdentity(identity);
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

describe("assessments.listMine", () => {
  it("lists only the caller's Assessments, newest first, with names and no video", async () => {
    await makeFundi(WANJIRU, ["electrical", "hairdressing"]);
    await makeFundi(OTIENO);
    const first = await upload(WANJIRU);
    await upload(OTIENO);
    const second = await upload(WANJIRU, CORNROWS);

    const mine = await t.withIdentity(WANJIRU).query(api.assessments.listMine, {});
    expect(mine.map((a) => a._id)).toEqual([second, first]);
    expect(mine[0]).toMatchObject({
      status: "queued",
      tradeSlug: "hairdressing",
      tradeName: "Hairdressing",
      taskSlug: "cornrows",
      taskName: "Cornrows",
    });
    expect(mine[1]).toMatchObject({ tradeName: "Electrical", taskName: "Install a 13A socket" });
    // List queries never carry the video (spec §7).
    for (const row of mine) {
      expect(row).not.toHaveProperty("videoUrl");
      expect(row).not.toHaveProperty("videoStorageId");
    }
  });

  it("reflects a status change, so the status chip updates without a refresh (US-3.1, US-4.1)", async () => {
    await makeFundi(WANJIRU);
    const id = await upload(WANJIRU);
    const as = t.withIdentity(WANJIRU);
    expect((await as.query(api.assessments.listMine, {}))[0].status).toBe("queued");

    await t.run((ctx) => ctx.db.patch("assessments", id, { status: "analyzing", attempts: 1 }));
    expect((await as.query(api.assessments.listMine, {}))[0].status).toBe("analyzing");

    const reshootReason = { code: "too_dark" as const, en: "The video is too dark.", sw: "" };
    await t.run((ctx) => ctx.db.patch("assessments", id, { status: "reshoot", reshootReason }));
    expect((await as.query(api.assessments.listMine, {}))[0]).toMatchObject({
      status: "reshoot",
      reshootReason,
    });
  });

  it("refuses a signed-out caller and a User who is not a Fundi", async () => {
    await expect(t.query(api.assessments.listMine, {})).rejects.toThrowError(/not authenticated/i);
    await t.withIdentity(OTIENO).mutation(api.users.store, {});
    await expect(t.withIdentity(OTIENO).query(api.assessments.listMine, {})).rejects.toThrowError(
      /fundi profile is required/i,
    );
  });
});

describe("assessments.get", () => {
  it("returns the owner's Assessment with its video URL", async () => {
    await makeFundi(WANJIRU);
    const id = await upload(WANJIRU);
    const detail = await t.withIdentity(WANJIRU).query(api.assessments.get, { assessmentId: id });
    expect(detail).toMatchObject({
      _id: id,
      status: "queued",
      tradeName: "Electrical",
      taskName: "Install a 13A socket",
      consentVersion: "consent-v1",
    });
    expect(detail?.livenessCode).toMatch(/^[0-9]{3}$/);
    expect(detail?.videoUrl).toMatch(/^https:\/\//);
  });

  it("returns a null video URL once the video is deleted", async () => {
    await makeFundi(WANJIRU);
    const id = await upload(WANJIRU);
    await t.run(async (ctx) => {
      const row = await ctx.db.get("assessments", id);
      if (row?.videoStorageId) await ctx.storage.delete(row.videoStorageId);
      await ctx.db.patch("assessments", id, { videoStorageId: undefined, videoDeletedAt: Date.now() });
    });
    const detail = await t.withIdentity(WANJIRU).query(api.assessments.get, { assessmentId: id });
    expect(detail?.videoUrl).toBeNull();
  });

  it("shows another Fundi nothing, and refuses a signed-out caller", async () => {
    await makeFundi(WANJIRU);
    await makeFundi(OTIENO);
    const id = await upload(WANJIRU);
    expect(await t.withIdentity(OTIENO).query(api.assessments.get, { assessmentId: id })).toBeNull();
    await expect(t.query(api.assessments.get, { assessmentId: id })).rejects.toThrowError(
      /not authenticated/i,
    );
  });
});

describe("lib/assessmentUpload", () => {
  it("steps past excluded Liveness codes and pads to 3 digits", () => {
    expect(pickLivenessCode([], () => 0.007)).toBe("007");
    expect(pickLivenessCode(["007", "008"], () => 0.007)).toBe("009");
    expect(pickLivenessCode(["999"], () => 0.9999)).toBe("000");
  });

  it("accepts video/* only, whatever the case", () => {
    expect(checkVideoFile({ size: 1, contentType: "Video/MP4" })).toBeNull();
    expect(checkVideoFile({ size: 1, contentType: "video/" })).toBe("wrong_type");
    expect(checkVideoFile({ size: 1, contentType: "application/octet-stream" })).toBe("wrong_type");
  });
});

describe("lib/storage isStorageReferenced", () => {
  it("is false for a stored file no table records", async () => {
    const storageId = await storeVideo();
    expect(await t.run((ctx) => isStorageReferenced(ctx, storageId))).toBe(false);
  });

  it("is true once an Assessment records the file as its video", async () => {
    const code = await readyFundi();
    const storageId = await storeVideo();
    await t.withIdentity(WANJIRU).mutation(api.assessments.create, { ...SOCKET, storageId, livenessCode: code });
    expect(await t.run((ctx) => isStorageReferenced(ctx, storageId))).toBe(true);
  });
});
