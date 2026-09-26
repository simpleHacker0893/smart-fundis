// Showcase links (US-3.8, ADR-7, spec §7): YouTube and TikTok links a Fundi
// shares beside their in-app uploads. Embedded only, with youtube-nocookie or
// the TikTok embed player; never downloaded, and they never earn a Badge.
// Always shown with the "Showcase — not verified" label.

export type ShowcaseLink = {
  kind: "youtube" | "tiktok";
  /** The video id, checked against the site's id format. */
  id: string;
  /** What the Fundi pasted, trimmed. */
  url: string;
  /** The only URL ever put in an iframe: built from the checked id. */
  embedUrl: string;
};

export type ShowcaseLinkError = "empty" | "unsupported" | "tiktok_short";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const TIKTOK_SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^\d{8,25}$/;

/** Reads a pasted YouTube or TikTok video link into an embeddable link, or says why not. */
export function parseShowcaseLink(
  input: string,
): { ok: true; link: ShowcaseLink } | { ok: false; error: ShowcaseLinkError } {
  const url = input.trim();
  if (url === "") return { ok: false, error: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`);
  } catch {
    return { ok: false, error: "unsupported" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { ok: false, error: "unsupported" };
  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    const id =
      host === "youtu.be"
        ? segments[0]
        : segments[0] === "watch"
          ? parsed.searchParams.get("v")
          : segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live"
            ? segments[1]
            : null;
    if (id && YOUTUBE_ID.test(id)) {
      return { ok: true, link: { kind: "youtube", id, url, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } };
    }
    return { ok: false, error: "unsupported" };
  }

  if (TIKTOK_SHORT_HOSTS.has(host)) return { ok: false, error: "tiktok_short" };
  if (TIKTOK_HOSTS.has(host)) {
    // https://www.tiktok.com/@user/video/<id>
    const at = segments.indexOf("video");
    const id = at >= 0 ? segments[at + 1] : undefined;
    if (id && TIKTOK_ID.test(id)) {
      return { ok: true, link: { kind: "tiktok", id, url, embedUrl: `https://www.tiktok.com/player/v1/${id}` } };
    }
  }
  return { ok: false, error: "unsupported" };
}
