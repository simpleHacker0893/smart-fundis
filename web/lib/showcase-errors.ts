import { ConvexError } from "convex/values";
import type { ShowcaseKind, ShowcaseSlotError } from "@convex/lib/showcaseLinks";

/** A Showcase slot's error: the shared parser's, or "save" for any other failure. */
export type ShowcaseErrorKey = ShowcaseSlotError | "save";

// The field errors fundiProfiles.setShowcaseLinks can send for each slot
// (never "empty": the server clears a blank slot). `satisfies` fails the
// build if a code is added to the parser without deciding here.
const SERVER_CODES = {
  youtube: ["unsupported", "wrong_site"],
  tiktok: ["unsupported", "wrong_site", "tiktok_short"],
} as const satisfies Record<ShowcaseKind, readonly Exclude<ShowcaseSlotError, "empty">[]>;

/**
 * The Showcase.errors key for a failed fundiProfiles.setShowcaseLinks call
 * on one slot: the slot's field error from `{ code: "invalid", fields }`,
 * else "save".
 */
export function showcaseSaveErrorKey(error: unknown, kind: ShowcaseKind): ShowcaseErrorKey {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    const data = error.data as { code?: unknown; fields?: unknown };
    if (data.code === "invalid" && typeof data.fields === "object" && data.fields !== null) {
      const code: unknown = (data.fields as Record<string, unknown>)[kind];
      const known: readonly string[] = SERVER_CODES[kind];
      if (typeof code === "string" && known.includes(code)) return code as ShowcaseSlotError;
    }
  }
  return "save";
}

// The sites a Showcase link may come from, by registrable domain. Only for
// choosing the message: parseShowcaseLink and the server stay the authority.
const SHOWCASE_DOMAINS = ["youtube.com", "youtu.be", "tiktok.com"] as const;

/**
 * Whether pasted text points at YouTube or TikTok at all, so a refused link
 * can say "Only YouTube or TikTok links" (another site) or "Use a link to
 * one video" (the right site, the wrong kind of page). Never fetches it.
 */
export function isShowcaseHost(text: string): boolean {
  const trimmed = text.trim();
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    return SHOWCASE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
