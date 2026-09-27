import { checkVideoFile, type VideoRejection } from "@convex/lib/assessmentUpload";

// The browser half of the Fundi's upload (#38, US-3.5, US-3.6). The server
// (assessments.create) stays the authority; this only saves a wasted upload.

/**
 * Why a picked file cannot be uploaded, or null when it can: at most 100 MB
 * and a `video/*` type, the same rule assessments.create applies.
 */
export function checkVideoBeforeUpload(file: { size: number; type: string }): VideoRejection | null {
  return checkVideoFile({ size: file.size, contentType: file.type });
}

/** How a POST to the Convex upload URL failed. */
export type UploadFailure = "network" | "upload_failed";

export class UploadError extends Error {
  constructor(readonly code: UploadFailure) {
    super(`video upload failed: ${code}`);
    this.name = "UploadError";
  }
}

/**
 * POSTs the video to a Convex upload URL (Convex file storage docs: POST the
 * raw file with its Content-Type; the reply is `{ storageId }`). Uses XHR,
 * not fetch, because only XHR reports upload progress. `onProgress` gets a
 * whole percentage, and 100 once the server has the file.
 */
export function postVideo(
  url: string,
  file: Blob,
  onProgress: (percent: number) => void,
  makeXhr: () => XMLHttpRequest = () => new XMLHttpRequest(),
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = makeXhr();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.floor((event.loaded / event.total) * 100));
    };
    const fail = (code: UploadFailure) => () => reject(new UploadError(code));
    xhr.onerror = fail("network");
    xhr.ontimeout = fail("network");
    xhr.onabort = fail("network");
    xhr.onload = () => {
      const storageId = xhr.status >= 200 && xhr.status < 300 ? readStorageId(xhr.responseText) : null;
      if (storageId === null) {
        reject(new UploadError("upload_failed"));
        return;
      }
      onProgress(100);
      resolve(storageId);
    };
    xhr.send(file);
  });
}

function readStorageId(text: string): string | null {
  try {
    const body: unknown = JSON.parse(text);
    if (body && typeof body === "object" && "storageId" in body && typeof body.storageId === "string") {
      return body.storageId;
    }
  } catch {
    // Not JSON: treated as a failed upload.
  }
  return null;
}
