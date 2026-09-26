import type { UploadRejection } from "@convex/lib/assessmentUpload";
import { UploadError, type UploadFailure } from "@/lib/video-upload";

/**
 * Every reason an upload can fail, each an `UploadFlow.errors.<key>` message:
 * assessments.create's rejection codes, a failed POST, and anything else.
 */
export type UploadErrorKey = UploadRejection | UploadFailure | "unexpected";

export const UPLOAD_ERROR_KEYS = [
  "not_signed_in",
  "no_user",
  "not_fundi",
  "file_missing",
  "file_in_use",
  "too_large",
  "wrong_type",
  "consent_missing",
  "consent_outdated",
  "client_consent_missing",
  "unknown_task",
  "liveness_missing",
  "liveness_mismatch",
  "liveness_expired",
  "invalid_previous",
  "network",
  "upload_failed",
  "unexpected",
] as const satisfies readonly UploadErrorKey[];

/** The key for an error thrown while uploading. */
export function uploadErrorKey(error: unknown): UploadErrorKey {
  return error instanceof UploadError ? error.code : "unexpected";
}

/**
 * What the Fundi can do next: try the same video again, get a new Liveness
 * code (and record again showing it), or fix what the message says.
 */
export function recoveryFor(key: UploadErrorKey): "retry" | "newCode" | "none" {
  switch (key) {
    case "network":
    case "upload_failed":
    case "file_missing":
    case "file_in_use":
    case "no_user":
    case "unexpected":
      return "retry";
    case "liveness_missing":
    case "liveness_mismatch":
    case "liveness_expired":
      return "newCode";
    default:
      return "none";
  }
}
