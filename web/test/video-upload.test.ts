import { describe, expect, it } from "vitest";
import { MAX_VIDEO_BYTES } from "@convex/lib/assessmentUpload";
import { checkVideoBeforeUpload, postVideo, UploadError } from "@/lib/video-upload";

describe("checkVideoBeforeUpload (US-3.6, same rule as the server)", () => {
  it("accepts a video at the 100 MB limit", () => {
    expect(checkVideoBeforeUpload({ size: MAX_VIDEO_BYTES, type: "video/mp4" })).toBeNull();
  });

  it("rejects a file over 100 MB", () => {
    expect(checkVideoBeforeUpload({ size: MAX_VIDEO_BYTES + 1, type: "video/mp4" })).toBe("too_large");
  });

  it("rejects a file that is not video/*", () => {
    expect(checkVideoBeforeUpload({ size: 10, type: "image/jpeg" })).toBe("wrong_type");
    expect(checkVideoBeforeUpload({ size: 10, type: "" })).toBe("wrong_type");
  });

  it("accepts the iPhone QuickTime type", () => {
    expect(checkVideoBeforeUpload({ size: 10, type: "video/quicktime" })).toBeNull();
  });
});

/** A fake XMLHttpRequest the test drives by hand. */
class FakeXhr {
  static last: FakeXhr | undefined;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  body: unknown;
  status = 0;
  responseText = "";
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  respond(status: number, text: string) {
    this.status = status;
    this.responseText = text;
    this.onload?.();
  }
}

const video = { size: 2048, type: "video/mp4" } as unknown as Blob;
const xhr = () => new FakeXhr() as unknown as XMLHttpRequest;

describe("postVideo (Convex upload URL, US-3.6)", () => {
  it("POSTs the file with its Content-Type and resolves the storageId", async () => {
    const done = postVideo("https://upload.example/abc", video, () => {}, xhr);
    const req = FakeXhr.last!;
    expect(req.method).toBe("POST");
    expect(req.url).toBe("https://upload.example/abc");
    expect(req.headers["Content-Type"]).toBe("video/mp4");
    expect(req.body).toBe(video);
    req.respond(200, JSON.stringify({ storageId: "kg2abc" }));
    await expect(done).resolves.toBe("kg2abc");
  });

  it("reports progress as a whole percentage", async () => {
    const seen: number[] = [];
    const done = postVideo("u", video, (p) => seen.push(p), xhr);
    const req = FakeXhr.last!;
    req.upload.onprogress?.({ lengthComputable: true, loaded: 512, total: 2048 });
    req.upload.onprogress?.({ lengthComputable: true, loaded: 2047, total: 2048 });
    req.upload.onprogress?.({ lengthComputable: false, loaded: 0, total: 0 });
    req.respond(200, JSON.stringify({ storageId: "s" }));
    await done;
    expect(seen).toEqual([25, 99, 100]);
  });

  it("rejects with 'network' when the connection drops", async () => {
    const done = postVideo("u", video, () => {}, xhr);
    FakeXhr.last!.onerror?.();
    await expect(done).rejects.toEqual(new UploadError("network"));
  });

  it("rejects with 'network' on a timeout", async () => {
    const done = postVideo("u", video, () => {}, xhr);
    FakeXhr.last!.ontimeout?.();
    await expect(done).rejects.toEqual(new UploadError("network"));
  });

  it("rejects with 'upload_failed' on an HTTP error or a reply without a storageId", async () => {
    const failed = postVideo("u", video, () => {}, xhr);
    FakeXhr.last!.respond(500, "oops");
    await expect(failed).rejects.toEqual(new UploadError("upload_failed"));

    const garbled = postVideo("u", video, () => {}, xhr);
    FakeXhr.last!.respond(200, "not json");
    await expect(garbled).rejects.toEqual(new UploadError("upload_failed"));
  });
});
