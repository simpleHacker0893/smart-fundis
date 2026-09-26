import { describe, expect, it } from "vitest";
import { parseShowcaseLink } from "@/lib/showcase-links";

// Showcase links (US-3.8, ADR-7): a Fundi may share YouTube and TikTok links
// beside their in-app uploads. They are embedded only (youtube-nocookie or the
// TikTok player), never downloaded, and never earn a Badge.

// The operator's sample links (2026-09-26).
const SAMPLE_ELECTRICAL = "https://www.youtube.com/watch?v=2tdN85reWN0";
const SAMPLE_HAIRDRESSING = "https://www.youtube.com/watch?v=qSHhSnuUcXc";

describe("parseShowcaseLink", () => {
  it("embeds the operator's sample YouTube links with youtube-nocookie", () => {
    expect(parseShowcaseLink(SAMPLE_ELECTRICAL)).toEqual({
      ok: true,
      link: {
        kind: "youtube",
        id: "2tdN85reWN0",
        url: SAMPLE_ELECTRICAL,
        embedUrl: "https://www.youtube-nocookie.com/embed/2tdN85reWN0",
      },
    });
    expect(parseShowcaseLink(SAMPLE_HAIRDRESSING)).toMatchObject({ ok: true, link: { kind: "youtube", id: "qSHhSnuUcXc" } });
  });

  it("accepts the other YouTube link shapes and trims spaces", () => {
    for (const url of [
      "  https://youtu.be/qSHhSnuUcXc  ",
      "https://m.youtube.com/watch?v=qSHhSnuUcXc&t=12s",
      "https://youtube.com/shorts/qSHhSnuUcXc",
      "https://www.youtube.com/embed/qSHhSnuUcXc",
      "youtube.com/watch?v=qSHhSnuUcXc",
      "http://www.youtube.com/watch?v=qSHhSnuUcXc",
    ]) {
      expect(parseShowcaseLink(url), url).toMatchObject({ ok: true, link: { kind: "youtube", id: "qSHhSnuUcXc" } });
    }
  });

  it("embeds a TikTok video link with the TikTok player", () => {
    const url = "https://www.tiktok.com/@fundi.wanjiru/video/7212345678901234567";
    expect(parseShowcaseLink(url)).toEqual({
      ok: true,
      link: { kind: "tiktok", id: "7212345678901234567", url, embedUrl: "https://www.tiktok.com/player/v1/7212345678901234567" },
    });
  });

  it("asks for the full TikTok link when given a short one it cannot read", () => {
    expect(parseShowcaseLink("https://vm.tiktok.com/ZMabc123/")).toEqual({ ok: false, error: "tiktok_short" });
  });

  it("refuses other sites, bad ids and other schemes", () => {
    expect(parseShowcaseLink("")).toEqual({ ok: false, error: "empty" });
    for (const url of [
      "https://vimeo.com/123",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com.evil.example/watch?v=qSHhSnuUcXc",
      "javascript:alert(1)",
      "ftp://www.youtube.com/watch?v=qSHhSnuUcXc",
      "https://www.youtube.com/playlist?list=PL123",
    ]) {
      expect(parseShowcaseLink(url), url).toEqual({ ok: false, error: "unsupported" });
    }
  });
});
