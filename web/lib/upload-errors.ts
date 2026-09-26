import type { UploadRejection } from "@convex/lib/assessmentUpload";
import { UploadError, type UploadFailure } from "@/lib/video-upload";

/**
 * Every reason an upload can fail: assessments.create's rejection codes, a
 * failed POST, and anything else.
 */
export type UploadErrorKey = UploadRejection | UploadFailure | "unexpected";

/**
 * What the Fundi can do next: try the same video again, get a new Liveness
 * code (and record again showing it), or fix what the message says.
 */
export type UploadRecovery = "retry" | "newCode" | "none";

/**
 * Each code's `UploadFlow.<messageKey>` message and its recovery. Typed over
 * every UploadErrorKey, so a new rejection code in convex/lib/assessmentUpload
 * does not compile until it is mapped here (and given a message in en.json).
 */
export const UPLOAD_ERRORS = {
  not_signed_in: { messageKey: "errors.not_signed_in", recovery: "none" },
  no_user: { messageKey: "errors.no_user", recovery: "retry" },
  not_fundi: { messageKey: "errors.not_fundi", recovery: "none" },
  file_missing: { messageKey: "errors.file_missing", recovery: "retry" },
  file_in_use: { messageKey: "errors.file_in_use", recovery: "retry" },
  too_large: { messageKey: "errors.too_large", recovery: "none" },
  wrong_type: { messageKey: "errors.wrong_type", recovery: "none" },
  consent_missing: { messageKey: "errors.consent_missing", recovery: "none" },
  consent_outdated: { messageKey: "errors.consent_outdated", recovery: "none" },
  client_consent_missing: { messageKey: "errors.client_consent_missing", recovery: "none" },
  unknown_task: { messageKey: "errors.unknown_task", recovery: "none" },
  liveness_missing: { messageKey: "errors.liveness_missing", recovery: "newCode" },
  liveness_mismatch: { messageKey: "errors.liveness_mismatch", recovery: "newCode" },
  liveness_expired: { messageKey: "errors.liveness_expired", recovery: "newCode" },
  invalid_previous: { messageKey: "errors.invalid_previous", recovery: "none" },
  network: { messageKey: "errors.network", recovery: "retry" },
  upload_failed: { messageKey: "errors.upload_failed", recovery: "retry" },
  unexpected: { messageKey: "errors.unexpected", recovery: "retry" },
} as const satisfies { [K in UploadErrorKey]: { messageKey: `errors.${K}`; recovery: UploadRecovery } };

/** The key for an error thrown while uploading. */
export function uploadErrorKey(error: unknown): UploadErrorKey {
  return error instanceof UploadError ? error.code : "unexpected";
}
