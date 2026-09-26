// Showcase links (US-3.8, ADR-7, spec §7): the YouTube and TikTok links a
// Fundi shares beside their in-app uploads. Embedded only, with
// youtube-nocookie or the TikTok embed player; never downloaded, and they
// never earn a Badge. Always shown with the "Showcase — not verified" label.
//
// Shared by the web form (imported as `@convex/lib/showcaseLinks`) and
// fundiProfiles.setShowcaseLinks, so both apply the same rule.
//
// Every URL this returns is rebuilt from the checked parts (video id, TikTok
// handle); the pasted text is never passed on. fundiProfiles.links stores
// `link.url`, the canonical link:
// - YouTube: https://www.youtube.com/watch?v=<11-char id>
// - TikTok:  https://www.tiktok.com/@<handle>/video/<digits>

export type ShowcaseKind = "youtube" | "tiktok";

export type ShowcaseLink = {
  kind: ShowcaseKind;
  /** The video id, checked against the site's id format. */
  id: string;
  /** The canonical link to the video on its site, built from the checked parts. */
  url: string;
  /** The only URL ever put in an iframe: built from the checked id. */
  embedUrl: string;
};

export type ShowcaseLinkError = "empty" | "unsupported" | "tiktok_short";

/** parseShowcaseLinkFor adds `wrong_site`: a valid link of the other site. */
export type ShowcaseSlotError = ShowcaseLinkError | "wrong_site";

export const SHOWCASE_URL_MAX = 2048;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const TIKTOK_SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^\d{8,25}$/;
// TikTok usernames: letters, digits, "_" and ".", at most 24 characters.
const TIKTOK_HANDLE = /^@[A-Za-z0-9_.]{1,24}$/;

/** Reads a pasted YouTube or TikTok video link into an embeddable link, or says why not. */
export function parseShowcaseLink(
  input: string,
): { ok: true; link: ShowcaseLink } | { ok: false; error: ShowcaseLinkError } {
  const text = input.trim();
  if (text === "") return { ok: false, error: "empty" };
  if (text.length > SHOWCASE_URL_MAX) return { ok: false, error: "unsupported" };

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
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
      return {
        ok: true,
        link: {
          kind: "youtube",
          id,
          url: `https://www.youtube.com/watch?v=${id}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        },
      };
    }
    return { ok: false, error: "unsupported" };
  }

  if (TIKTOK_SHORT_HOSTS.has(host)) return { ok: false, error: "tiktok_short" };
  if (TIKTOK_HOSTS.has(host)) {
    // https://www.tiktok.com/@user/video/<id>
    const [handle, video, id] = segments;
    if (handle && TIKTOK_HANDLE.test(handle) && video === "video" && id && TIKTOK_ID.test(id)) {
      return {
        ok: true,
        link: {
          kind: "tiktok",
          id,
          url: `https://www.tiktok.com/${handle}/video/${id}`,
          embedUrl: `https://www.tiktok.com/player/v1/${id}`,
        },
      };
    }
  }
  return { ok: false, error: "unsupported" };
}

/**
 * parseShowcaseLink for one slot of the profile: a valid link of the other
 * site (a YouTube link in the TikTok slot) is `wrong_site`.
 */
export function parseShowcaseLinkFor(
  kind: ShowcaseKind,
  input: string,
): { ok: true; link: ShowcaseLink } | { ok: false; error: ShowcaseSlotError } {
  const result = parseShowcaseLink(input);
  if (result.ok && result.link.kind !== kind) return { ok: false, error: "wrong_site" };
  return result;
}
