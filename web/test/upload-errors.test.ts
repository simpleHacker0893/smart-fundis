import { describe, expect, it } from "vitest";
import { uploadRejectionValidator } from "@convex/lib/assessmentUpload";
import en from "@/messages/en.json";
import { UploadError } from "@/lib/video-upload";
import { recoveryFor, uploadErrorKey, UPLOAD_ERROR_KEYS } from "@/lib/upload-errors";

const rejectionCodes = uploadRejectionValidator.members.map((m) => m.value);

describe("upload error copy (US-3.6)", () => {
  it("covers every rejection code assessments.create can return", () => {
    for (const code of rejectionCodes) expect(UPLOAD_ERROR_KEYS).toContain(code);
  });

  it("has an en.json message for every key", () => {
    const messages = en.UploadFlow.errors as Record<string, string>;
    for (const key of UPLOAD_ERROR_KEYS) expect(messages[key], key).toMatch(/\S/);
    expect(Object.keys(messages).sort()).toEqual([...UPLOAD_ERROR_KEYS].sort());
  });

  it("maps a failed POST to its code and anything else to 'unexpected'", () => {
    expect(uploadErrorKey(new UploadError("network"))).toBe("network");
    expect(uploadErrorKey(new UploadError("upload_failed"))).toBe("upload_failed");
    expect(uploadErrorKey(new Error("boom"))).toBe("unexpected");
  });

  it("offers a retry for transient failures, a new code for Liveness problems, and nothing when the Fundi must change something", () => {
    expect(recoveryFor("network")).toBe("retry");
    expect(recoveryFor("upload_failed")).toBe("retry");
    expect(recoveryFor("file_missing")).toBe("retry");
    expect(recoveryFor("unexpected")).toBe("retry");
    expect(recoveryFor("liveness_expired")).toBe("newCode");
    expect(recoveryFor("liveness_mismatch")).toBe("newCode");
    expect(recoveryFor("liveness_missing")).toBe("newCode");
    expect(recoveryFor("too_large")).toBe("none");
    expect(recoveryFor("wrong_type")).toBe("none");
    expect(recoveryFor("consent_missing")).toBe("none");
  });
});
