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
