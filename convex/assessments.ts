import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { checkFundi, requireFundi, requireStoredUser } from "./lib/auth";
import {
  CONSENT_VERSION,
  checkVideoFile,
  LIVENESS_CODE_TTL_MS,
  pickLivenessCode,
  type UploadRejection,
  uploadRejectionValidator,
} from "./lib/assessmentUpload";
import { isStorageReferenced } from "./lib/storage";
import { taskNeedsClientConsent } from "./lib/trades";
import { assessmentStatusValidator, reshootReasonValidator } from "./lib/validators";

// The Fundi's upload flow (#38). Architecture spec §5 (status table: (new) ->
// queued) and §7 (consent, video access).

/**
 * A short-lived (1 hour) URL the client POSTs the video to. The upload
 * response carries the storageId that assessments.create records.
 * Guard: requireFundi.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireFundi(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** The caller's pending Liveness code row, if any (expired or not). */
async function pendingCodeRow(ctx: QueryCtx, userId: Id<"users">): Promise<Doc<"livenessCodes"> | null> {
  return await ctx.db
    .query("livenessCodes")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

/**
 * US-3.4: issues a fresh 3-digit Liveness code for the caller's next
 * Assessment and returns it for the large on-screen display. The code is
 * stored server-side (one `livenessCodes` row per User, replaced on each
 * call) and assessments.create copies it onto the Assessment and deletes the
 * row, so every Assessment gets its own code and the client cannot choose
 * one. It differs from the code it replaces and from the caller's latest
 * Assessment's code. Guard: requireFundi.
 */
export const newLivenessCode = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const { user } = await requireFundi(ctx);
    const pending = await pendingCodeRow(ctx, user._id);
    const latest = await ctx.db
      .query("assessments")
      .withIndex("by_fundiUserId", (q) => q.eq("fundiUserId", user._id))
      .order("desc")
      .first();
    const avoid = [pending?.code, latest?.livenessCode].filter((c): c is string => c !== undefined);
    const code = pickLivenessCode(avoid);
    const issuedAt = Date.now();
    if (pending === null) {
      await ctx.db.insert("livenessCodes", { userId: user._id, code, issuedAt });
    } else {
      await ctx.db.replace("livenessCodes", pending._id, { userId: user._id, code, issuedAt });
    }
    return code;
  },
});

/**
 * The caller's issued, unused Liveness code and when it expires, or null.
 * Lets the recording screen show the same code again after a reload instead
 * of issuing a new one. A query must not read the clock (Convex guidelines),
 * so the client compares `expiresAt` with its own time and calls
 * newLivenessCode once it has passed; assessments.create enforces the
 * expiry. Guard: requireFundi.
 */
export const currentLivenessCode = query({
  args: {},
  returns: v.union(v.object({ code: v.string(), expiresAt: v.number() }), v.null()),
  handler: async (ctx) => {
    const { user } = await requireFundi(ctx);
    const pending = await pendingCodeRow(ctx, user._id);
    return pending === null ? null : { code: pending.code, expiresAt: pending.issuedAt + LIVENESS_CODE_TTL_MS };
  },
});

/** The active Rubric of a Verify-now Trade when it is this Task's, else null. */
async function activeRubricFor(
  ctx: QueryCtx,
  tradeSlug: string,
  taskSlug: string,
): Promise<Doc<"rubrics"> | null> {
  const trade = await ctx.db
    .query("trades")
    .withIndex("by_slug", (q) => q.eq("slug", tradeSlug))
    .unique();
  if (trade?.activeRubricId === undefined) return null;
  const rubric = await ctx.db.get("rubrics", trade.activeRubricId);
  if (rubric === null || rubric.status !== "active") return null;
  return rubric.tradeSlug === tradeSlug && rubric.taskSlug === taskSlug ? rubric : null;
}

type CreateArgs = {
  storageId: Id<"_storage">;
  tradeSlug: string;
  taskSlug: string;
  consentVersion?: string;
  clientConsent?: boolean;
  livenessCode?: string;
  previousAssessmentId?: Id<"assessments">;
};

/**
 * Every check on an upload after the caller and the file exist, in the order
 * the Fundi meets them. Returns what to insert, or why not.
 */
async function checkUpload(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: CreateArgs,
  file: { size: number; contentType?: string },
  now: number,
): Promise<
  | { ok: true; rubric: Doc<"rubrics">; pending: Doc<"livenessCodes">; clientConsent: boolean }
  | { ok: false; code: UploadRejection }
> {
  const fileProblem = checkVideoFile(file);
  if (fileProblem !== null) return { ok: false, code: fileProblem };

  if (args.consentVersion === undefined || args.consentVersion.trim() === "") {
    return { ok: false, code: "consent_missing" };
  }
  if (args.consentVersion !== CONSENT_VERSION) return { ok: false, code: "consent_outdated" };

  const rubric = await activeRubricFor(ctx, args.tradeSlug, args.taskSlug);
  if (rubric === null) return { ok: false, code: "unknown_task" };

  const clientConsent = taskNeedsClientConsent(rubric.tradeSlug, rubric.taskSlug);
  if (clientConsent && args.clientConsent !== true) return { ok: false, code: "client_consent_missing" };

  const pending = await pendingCodeRow(ctx, userId);
  if (pending === null) return { ok: false, code: "liveness_missing" };
  if (args.livenessCode !== pending.code) return { ok: false, code: "liveness_mismatch" };
  if (now - pending.issuedAt > LIVENESS_CODE_TTL_MS) return { ok: false, code: "liveness_expired" };

  if (args.previousAssessmentId !== undefined) {
    const previous = await ctx.db.get("assessments", args.previousAssessmentId);
    if (
      previous === null ||
      previous.fundiUserId !== userId ||
      previous.tradeSlug !== rubric.tradeSlug ||
      (previous.status !== "reshoot" && previous.status !== "failed")
    ) {
      return { ok: false, code: "invalid_previous" };
    }
  }
  return { ok: true, rubric, pending, clientConsent };
}

/**
 * Records an uploaded video as a new Assessment in `queued` (spec §5, first
 * row of the status table; US-3.7, US-3.9).
 *
 * Guard: checkFundi (requireFundi's rules, without the throw). The server
 * checks, from the verified token and stored data only:
 * - the caller is signed in, has a users row and is a Fundi;
 * - the file, read from the `_storage` system table (never from args), is at
 *   most 100 MB and has a `video/*` content type;
 * - `consentVersion` is the current CONSENT_VERSION (`consent-v1`); the server
 *   sets `consentAt`;
 * - the Task is the active Rubric's Task of a Verify-now Trade;
 * - where a client is on camera (lib/trades.ts `clientOnCamera`),
 *   `clientConsent` is true;
 * - `livenessCode` equals the code newLivenessCode issued to this caller,
 *   which is at most 2 hours old. The stored code is the server's, and it is
 *   used up on success;
 * - `previousAssessmentId`, when given, is the caller's own `reshoot` or
 *   `failed` Assessment for the same Trade.
 *
 * Returns `{ ok: true, assessmentId }` or `{ ok: false, code }` instead of
 * throwing, on purpose: a throw rolls back every write of the mutation,
 * including `ctx.storage.delete`, so an invalid file would stay stored. On
 * every rejection the uploaded file is deleted, except when it is missing or
 * is already recorded by any table (`file_in_use`, lib/storage.ts
 * isStorageReferenced), which is never touched. The pending Liveness code
 * is kept, so the Fundi can retry.
 * Only `storageId` has a strict validator; the other checks run in the
 * handler so that a bad value still deletes the file.
 */
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    tradeSlug: v.string(),
    taskSlug: v.string(),
    consentVersion: v.optional(v.string()),
    clientConsent: v.optional(v.boolean()),
    livenessCode: v.optional(v.string()),
    previousAssessmentId: v.optional(v.id("assessments")),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), assessmentId: v.id("assessments") }),
    v.object({ ok: v.literal(false), code: uploadRejectionValidator }),
  ),
  handler: async (ctx, args) => {
    const caller = await checkFundi(ctx);

    const file = await ctx.db.system.get("_storage", args.storageId);
    if (file === null) {
      return { ok: false as const, code: caller.ok ? ("file_missing" as const) : caller.code };
    }
    // Never delete or reuse a file any table records (lib/storage.ts).
    if (await isStorageReferenced(ctx, args.storageId)) {
      return { ok: false as const, code: caller.ok ? ("file_in_use" as const) : caller.code };
    }

    if (!caller.ok) {
      await ctx.storage.delete(args.storageId);
      return { ok: false as const, code: caller.code };
    }
    const now = Date.now();
    const checked = await checkUpload(ctx, caller.user._id, args, file, now);
    if (!checked.ok) {
      await ctx.storage.delete(args.storageId);
      return { ok: false as const, code: checked.code };
    }

    const assessmentId = await ctx.db.insert("assessments", {
      fundiUserId: caller.user._id,
      tradeSlug: checked.rubric.tradeSlug,
      rubricId: checked.rubric._id,
      ...(args.previousAssessmentId !== undefined ? { previousAssessmentId: args.previousAssessmentId } : {}),
      consentVersion: CONSENT_VERSION,
      consentAt: now,
      ...(checked.clientConsent ? { clientConsent: true } : {}),
      videoStorageId: args.storageId,
      livenessCode: checked.pending.code,
      status: "queued",
      attempts: 0,
      licenseStatus: "none",
    });
    await ctx.db.delete("livenessCodes", checked.pending._id);
    return { ok: true as const, assessmentId };
  },
});

/** Far above what one Fundi records in the MVP; keeps listMine bounded. */
const LIST_MINE_LIMIT = 100;

/** The Trade and Task names of an Assessment (English; the web translates by slug). */
type Names = { tradeSlug: string; tradeName: string; taskSlug: string; taskName: string };

/** Looks up names once per Trade and Rubric, however many Assessments share them. */
function nameLookup(ctx: QueryCtx) {
  const trades = new Map<string, Promise<string>>();
  const rubrics = new Map<Id<"rubrics">, Promise<{ taskSlug: string; taskName: string }>>();
  return async (row: Doc<"assessments">): Promise<Names> => {
    let tradeName = trades.get(row.tradeSlug);
    if (tradeName === undefined) {
      tradeName = ctx.db
        .query("trades")
        .withIndex("by_slug", (q) => q.eq("slug", row.tradeSlug))
        .unique()
        .then((trade) => trade?.name ?? row.tradeSlug);
      trades.set(row.tradeSlug, tradeName);
    }
    let task = rubrics.get(row.rubricId);
    if (task === undefined) {
      task = ctx.db
        .get("rubrics", row.rubricId)
        .then((rubric) => ({ taskSlug: rubric?.taskSlug ?? "", taskName: rubric?.taskName ?? "" }));
      rubrics.set(row.rubricId, task);
    }
    return { tradeSlug: row.tradeSlug, tradeName: await tradeName, ...(await task) };
  };
}

const namesFields = {
  tradeSlug: v.string(),
  tradeName: v.string(),
  taskSlug: v.string(),
  taskName: v.string(),
};

const listItemValidator = v.object({
  _id: v.id("assessments"),
  _creationTime: v.number(),
  status: assessmentStatusValidator,
  ...namesFields,
  reshootReason: v.optional(reshootReasonValidator),
  previousAssessmentId: v.optional(v.id("assessments")),
});

/**
 * The caller's Assessments, newest first (at most 100), for the live status
 * chip (US-3.1, US-4.1): a Convex query, so the chip updates without a
 * refresh. Never returns the video (spec §7). Guard: requireFundi.
 */
export const listMine = query({
  args: {},
  returns: v.array(listItemValidator),
  handler: async (ctx) => {
    const { user } = await requireFundi(ctx);
    const rows = await ctx.db
      .query("assessments")
      .withIndex("by_fundiUserId", (q) => q.eq("fundiUserId", user._id))
      .order("desc")
      .take(LIST_MINE_LIMIT);
    const names = nameLookup(ctx);
    return await Promise.all(
      rows.map(async (row) => ({
        _id: row._id,
        _creationTime: row._creationTime,
        status: row.status,
        ...(await names(row)),
        ...(row.reshootReason !== undefined ? { reshootReason: row.reshootReason } : {}),
        ...(row.previousAssessmentId !== undefined ? { previousAssessmentId: row.previousAssessmentId } : {}),
      })),
    );
  },
});

/**
 * One Assessment for its owning Fundi, with the video URL (spec §7: only the
 * single-Assessment detail query and /ai/claim return getUrl). `videoUrl` is
 * null once the video is deleted. Returns null when the Assessment does not
 * exist or is not the caller's, so its existence does not leak. The Expert
 * and Admin cases come with #41 (canDecide).
 * Guard: requireStoredUser, then ownership (only a Fundi owns Assessments).
 */
export const get = query({
  args: { assessmentId: v.id("assessments") },
  returns: v.union(
    v.object({
      _id: v.id("assessments"),
      _creationTime: v.number(),
      status: assessmentStatusValidator,
      ...namesFields,
      livenessCode: v.string(),
      consentVersion: v.string(),
      consentAt: v.number(),
      clientConsent: v.optional(v.boolean()),
      reshootReason: v.optional(reshootReasonValidator),
      previousAssessmentId: v.optional(v.id("assessments")),
      videoUrl: v.union(v.string(), v.null()),
      videoDeletedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { user } = await requireStoredUser(ctx);
    const row = await ctx.db.get("assessments", args.assessmentId);
    if (row === null || row.fundiUserId !== user._id) return null;
    const videoUrl = row.videoStorageId === undefined ? null : await ctx.storage.getUrl(row.videoStorageId);
    return {
      _id: row._id,
      _creationTime: row._creationTime,
      status: row.status,
      ...(await nameLookup(ctx)(row)),
      livenessCode: row.livenessCode,
      consentVersion: row.consentVersion,
      consentAt: row.consentAt,
      ...(row.clientConsent !== undefined ? { clientConsent: row.clientConsent } : {}),
      ...(row.reshootReason !== undefined ? { reshootReason: row.reshootReason } : {}),
      ...(row.previousAssessmentId !== undefined ? { previousAssessmentId: row.previousAssessmentId } : {}),
      videoUrl,
      ...(row.videoDeletedAt !== undefined ? { videoDeletedAt: row.videoDeletedAt } : {}),
    };
  },
});
