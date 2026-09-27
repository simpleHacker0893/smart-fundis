import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { uploadRejectionValidator } from "@convex/lib/assessmentUpload";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { UploadError } from "@/lib/video-upload";
import { UPLOAD_ERRORS, uploadErrorKey } from "@/lib/upload-errors";

const rejectionCodes = uploadRejectionValidator.members.map((m) => m.value);
const codes = Object.keys(UPLOAD_ERRORS) as (keyof typeof UPLOAD_ERRORS)[];
const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "UploadFlow" });

describe("upload error copy (US-3.6)", () => {
  it("covers every rejection code assessments.create can return", () => {
    for (const code of rejectionCodes) expect(codes).toContain(code);
  });

  it("points every code at its own en.json message, and en.json has no others", () => {
    for (const code of codes) {
      const { messageKey } = UPLOAD_ERRORS[code];
      expect(messageKey).toBe(`errors.${code}`);
      expect(t(messageKey), code).toMatch(/\S/);
    }
    expect(Object.keys(en.UploadFlow.errors).sort()).toEqual([...codes].sort());
  });

  it("maps a failed POST to its code and anything else to 'unexpected'", () => {
    expect(uploadErrorKey(new UploadError("network"))).toBe("network");
    expect(uploadErrorKey(new UploadError("upload_failed"))).toBe("upload_failed");
    expect(uploadErrorKey(new Error("boom"))).toBe("unexpected");
  });

  it("offers a retry for transient failures, a new code for Liveness problems, and nothing when the Fundi must change something", () => {
    const recovery = (code: keyof typeof UPLOAD_ERRORS) => UPLOAD_ERRORS[code].recovery;
    for (const code of ["network", "upload_failed", "file_missing", "file_in_use", "no_user", "unexpected"] as const) {
      expect(recovery(code), code).toBe("retry");
    }
    for (const code of ["liveness_expired", "liveness_mismatch", "liveness_missing"] as const) {
      expect(recovery(code), code).toBe("newCode");
    }
    for (const code of ["too_large", "wrong_type", "consent_missing", "not_fundi", "invalid_previous"] as const) {
      expect(recovery(code), code).toBe("none");
    }
  });
});
