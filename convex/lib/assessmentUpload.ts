import { v, type Infer } from "convex/values";

// Rules for the Fundi's upload (#38, US-3.4, US-3.7, US-3.9). Pure, so the
// functions in assessments.ts and the tests share one definition.

/**
 * Why assessments.create refused an upload. The web maps each code to a
 * next-intl message.
 * - not_signed_in, no_user, not_fundi: the caller (requireFundi's cases);
 * - file_missing: no stored file has this storageId (nothing to delete);
 * - file_in_use: the file is already another Assessment's video (kept);
 * - too_large, wrong_type: the stored file's size or content type;
 * - consent_missing, consent_outdated: the verification consent;
 * - client_consent_missing: "The client agreed to be filmed" not ticked;
 * - unknown_task: not a Task of a Verify-now Trade with an active Rubric;
 * - liveness_missing, liveness_mismatch, liveness_expired: no code was
 *   issued, the client sent a different one, or it is too old;
 * - invalid_previous: previousAssessmentId is not the caller's `reshoot` or
 *   `failed` Assessment for the same Trade.
 */
export const uploadRejectionValidator = v.union(
  v.literal("not_signed_in"),
  v.literal("no_user"),
  v.literal("not_fundi"),
  v.literal("file_missing"),
  v.literal("file_in_use"),
  v.literal("too_large"),
  v.literal("wrong_type"),
  v.literal("consent_missing"),
  v.literal("consent_outdated"),
  v.literal("client_consent_missing"),
  v.literal("unknown_task"),
  v.literal("liveness_missing"),
  v.literal("liveness_mismatch"),
  v.literal("liveness_expired"),
  v.literal("invalid_previous"),
);
export type UploadRejection = Infer<typeof uploadRejectionValidator>;

/**
 * The verification consent the Fundi ticks before every upload (spec §7).
 * English only for now (D-64). Bump it whenever the consent text in
 * web/messages/en.json changes, including the "The client agreed to be
 * filmed" tick; assessments.create then rejects the old version.
 */
export const CONSENT_VERSION = "consent-v1";

/** US-3.9: at most 100 MB (binary megabytes, 100 * 1024 * 1024 bytes). */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/**
 * How long an issued Liveness code stays usable. It is shown just before
 * recording; the upload URL itself expires after 1 hour, so 2 hours covers
 * recording plus a slow upload, while an old code cannot prove a fresh video.
 */
export const LIVENESS_CODE_TTL_MS = 2 * 60 * 60 * 1000;

/** The metadata assessments.create reads from the `_storage` system table. */
export type StoredFileMetadata = { size: number; contentType?: string };

export type VideoRejection = Extract<UploadRejection, "too_large" | "wrong_type">;

/** Why the stored file is not an acceptable video, or null when it is. */
export function checkVideoFile(meta: StoredFileMetadata): VideoRejection | null {
  if (meta.size > MAX_VIDEO_BYTES) return "too_large";
  const type = meta.contentType?.trim().toLowerCase() ?? "";
  if (!/^video\/[a-z0-9.+-]+/.test(type)) return "wrong_type";
  return null;
}

/**
 * A random 3-digit code ("000"-"999") that is none of `avoid`, so a Fundi
 * never sees the same code twice in a row. `random` returns [0, 1).
 */
export function pickLivenessCode(avoid: readonly string[], random: () => number = Math.random): string {
  // Step on from a random start instead of redrawing, so this always ends.
  const start = Math.floor(random() * 1000) % 1000;
  for (let i = 0; i < 1000; i++) {
    const code = ((start + i) % 1000).toString().padStart(3, "0");
    if (!avoid.includes(code)) return code;
  }
  throw new Error("pickLivenessCode: every code is excluded");
}
