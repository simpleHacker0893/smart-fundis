import { describe, expect, it } from "vitest";
import { parseShowcaseLink, parseShowcaseLinkFor } from "./showcaseLinks";

// Showcase links (US-3.8, ADR-7): the one parser the web form and the server
// share. `url` is always the canonical link rebuilt from the checked parts,
// never the pasted text.

const SAMPLE_ELECTRICAL = "https://www.youtube.com/watch?v=2tdN85reWN0";
const TIKTOK = "https://www.tiktok.com/@fundi.wanjiru/video/7212345678901234567";

describe("parseShowcaseLink", () => {
  it("reads a YouTube watch link into the canonical link and a youtube-nocookie embed", () => {
    expect(parseShowcaseLink(SAMPLE_ELECTRICAL)).toEqual({
      ok: true,
      link: {
        kind: "youtube",
        id: "2tdN85reWN0",
        url: SAMPLE_ELECTRICAL,
        embedUrl: "https://www.youtube-nocookie.com/embed/2tdN85reWN0",
      },
    });
  });

  it("accepts the other YouTube shapes and returns the canonical watch link", () => {
    for (const input of [
      "  https://youtu.be/qSHhSnuUcXc  ",
      "https://m.youtube.com/watch?v=qSHhSnuUcXc&t=12s",
      "https://youtube.com/shorts/qSHhSnuUcXc",
      "https://www.youtube.com/embed/qSHhSnuUcXc",
      "https://www.youtube.com/live/qSHhSnuUcXc?si=abc",
      "youtube.com/watch?v=qSHhSnuUcXc",
      "http://www.youtube.com/watch?v=qSHhSnuUcXc",
      "HTTPS://WWW.YOUTUBE.COM/watch?v=qSHhSnuUcXc",
    ]) {
      expect(parseShowcaseLink(input), input).toEqual({
        ok: true,
        link: {
          kind: "youtube",
          id: "qSHhSnuUcXc",
          url: "https://www.youtube.com/watch?v=qSHhSnuUcXc",
          embedUrl: "https://www.youtube-nocookie.com/embed/qSHhSnuUcXc",
        },
      });
    }
  });

  it("reads a TikTok video link into the canonical link and the TikTok player", () => {
    expect(parseShowcaseLink(TIKTOK)).toEqual({
      ok: true,
      link: {
        kind: "tiktok",
        id: "7212345678901234567",
        url: TIKTOK,
        embedUrl: "https://www.tiktok.com/player/v1/7212345678901234567",
      },
    });
    expect(parseShowcaseLink("m.tiktok.com/@fundi.wanjiru/video/7212345678901234567?lang=en")).toEqual(
      parseShowcaseLink(TIKTOK),
    );
  });

  it("asks for the full TikTok link when given a short one", () => {
    expect(parseShowcaseLink("https://vm.tiktok.com/ZMabc123/")).toEqual({ ok: false, error: "tiktok_short" });
    expect(parseShowcaseLink("https://vt.tiktok.com/ZSabc123/")).toEqual({ ok: false, error: "tiktok_short" });
  });

  it("says empty for blank input", () => {
    expect(parseShowcaseLink("")).toEqual({ ok: false, error: "empty" });
    expect(parseShowcaseLink("   ")).toEqual({ ok: false, error: "empty" });
  });

  it("refuses other sites, bad ids, bad handles and other schemes", () => {
    for (const input of [
      "https://vimeo.com/123",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/watch?v=qSHhSnuUcX<",
      "https://www.youtube.com.evil.example/watch?v=qSHhSnuUcXc",
      "https://evil.example/?u=https://www.youtube.com/watch?v=qSHhSnuUcXc",
      "javascript:alert(1)",
      "ftp://www.youtube.com/watch?v=qSHhSnuUcXc",
      "https://www.youtube.com/playlist?list=PL123",
      "https://www.tiktok.com/@fundi/photo/7212345678901234567",
      "https://www.tiktok.com/video/7212345678901234567",
      "https://www.tiktok.com/@bad handle/video/7212345678901234567",
      "https://www.tiktok.com/@fundi/video/12ab",
      "not a link at all",
      `https://www.youtube.com/watch?v=qSHhSnuUcXc&x=${"a".repeat(3000)}`,
    ]) {
      expect(parseShowcaseLink(input), input).toEqual({ ok: false, error: "unsupported" });
    }
  });

  const CANONICAL = {
    ok: true,
    link: {
      kind: "youtube",
      id: "qSHhSnuUcXc",
      url: "https://www.youtube.com/watch?v=qSHhSnuUcXc",
      embedUrl: "https://www.youtube-nocookie.com/embed/qSHhSnuUcXc",
    },
  };

  it("reads the host after the userinfo, and never passes the userinfo on", () => {
    // The real host is evil.example; "www.youtube.com" is only the username.
    expect(parseShowcaseLink("https://www.youtube.com@evil.example/watch?v=qSHhSnuUcXc")).toEqual({
      ok: false,
      error: "unsupported",
    });
    // A YouTube host with userinfo gives the canonical link, rebuilt without it.
    expect(parseShowcaseLink("https://attacker@www.youtube.com/watch?v=qSHhSnuUcXc")).toEqual(CANONICAL);
  });

  it("refuses a trailing-dot host: the host allowlist is exact", () => {
    // `www.youtube.com.` resolves to YouTube, but no one pastes it; refusing
    // it keeps the allowlist a plain exact match.
    expect(parseShowcaseLink("https://www.youtube.com./watch?v=qSHhSnuUcXc")).toEqual({
      ok: false,
      error: "unsupported",
    });
  });

  it("refuses a lookalike host with a Cyrillic letter", () => {
    // "yоutube" with U+043E CYRILLIC SMALL LETTER O; URL turns it into punycode.
    expect(parseShowcaseLink("https://www.yоutube.com/watch?v=qSHhSnuUcXc")).toEqual({
      ok: false,
      error: "unsupported",
    });
  });

  it("refuses non-http schemes with or without //", () => {
    for (const input of ["data:text/html,x", "javascript:alert(1)", "javascript://%0Aalert(1)", "file:///etc/passwd"]) {
      expect(parseShowcaseLink(input), input).toEqual({ ok: false, error: "unsupported" });
    }
  });

  it("reads a host with a port, with or without a scheme", () => {
    for (const input of [
      "www.youtube.com:443/watch?v=qSHhSnuUcXc",
      "https://www.youtube.com:443/watch?v=qSHhSnuUcXc",
      "youtu.be:443/qSHhSnuUcXc",
    ]) {
      expect(parseShowcaseLink(input), input).toEqual(CANONICAL);
    }
  });

  it("refuses a TikTok handle made only of dots", () => {
    for (const handle of ["@.", "@...", "@........................"]) {
      const input = `https://www.tiktok.com/${handle}/video/7212345678901234567`;
      expect(parseShowcaseLink(input), input).toEqual({ ok: false, error: "unsupported" });
    }
    // A dot beside other characters is still fine.
    expect(parseShowcaseLink("https://www.tiktok.com/@.a./video/7212345678901234567")).toMatchObject({ ok: true });
  });
});

describe("parseShowcaseLinkFor", () => {
  it("accepts a link of the slot's own site", () => {
    expect(parseShowcaseLinkFor("youtube", SAMPLE_ELECTRICAL)).toMatchObject({ ok: true, link: { kind: "youtube" } });
    expect(parseShowcaseLinkFor("tiktok", TIKTOK)).toMatchObject({ ok: true, link: { kind: "tiktok" } });
  });

  it("says wrong_site for a link of the other site", () => {
    expect(parseShowcaseLinkFor("tiktok", SAMPLE_ELECTRICAL)).toEqual({ ok: false, error: "wrong_site" });
    expect(parseShowcaseLinkFor("youtube", TIKTOK)).toEqual({ ok: false, error: "wrong_site" });
  });

  it("passes the parser's own errors through", () => {
    expect(parseShowcaseLinkFor("tiktok", "https://vm.tiktok.com/ZMabc123/")).toEqual({ ok: false, error: "tiktok_short" });
    expect(parseShowcaseLinkFor("youtube", "https://vimeo.com/1")).toEqual({ ok: false, error: "unsupported" });
  });
});
