import { ConvexError } from "convex/values";

/**
 * The longest Expert note, after trimming. Mirrors NOTE_MAX_LENGTH in
 * convex/reviews.ts (a test keeps them equal); not imported from there so
 * the server module stays out of the client bundle.
 */
export const NOTE_MAX_LENGTH = 1000;

/** Every ConvexError code reviews.decide throws (a missing Assessment is `forbidden`). */
export type DecideRejection = "forbidden" | "invalid_status" | "note_required" | "note_too_long";

/** Every reason a decision can fail: the server's codes, and anything else. */
export type DecideErrorKey = DecideRejection | "unexpected";

/**
 * Each code's `DecisionForm.<key>` message. Typed over every DecideErrorKey,
 * so a new code does not compile until it is mapped here (and given a
 * message in en.json).
 */
export const DECIDE_ERRORS = {
  forbidden: "errors.forbidden",
  invalid_status: "errors.invalid_status",
  note_required: "errors.note_required",
  note_too_long: "errors.note_too_long",
  unexpected: "errors.unexpected",
} as const satisfies { [K in DecideErrorKey]: `errors.${K}` };

const REJECTIONS: readonly string[] = ["forbidden", "invalid_status", "note_required", "note_too_long"] satisfies DecideRejection[];

/** The key for an error thrown by reviews.decide: its code, else "unexpected". */
export function decideErrorKey(error: unknown): DecideErrorKey {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    const code: unknown = (error.data as { code?: unknown }).code;
    if (typeof code === "string" && REJECTIONS.includes(code)) return code as DecideRejection;
  }
  return "unexpected";
}
