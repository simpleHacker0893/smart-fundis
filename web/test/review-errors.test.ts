import { ConvexError } from "convex/values";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH as SERVER_NOTE_MAX_LENGTH } from "@convex/reviews";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { DECIDE_ERRORS, decideErrorKey, NOTE_MAX_LENGTH } from "@/lib/review-errors";

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "DecisionForm" });
const codes = Object.keys(DECIDE_ERRORS) as (keyof typeof DECIDE_ERRORS)[];

// reviews.decide throws ConvexError({ code, message }) with one of these codes
// (backend report, fix round 1: there is no not_found; a missing Assessment is forbidden).
const SERVER_CODES = ["forbidden", "invalid_status", "note_required", "note_too_long"] as const;

describe("decide error copy (US-5.3)", () => {
  it("maps every code reviews.decide can throw to itself", () => {
    for (const code of SERVER_CODES) {
      expect(decideErrorKey(new ConvexError({ code, message: "server text" }))).toBe(code);
    }
  });

  it("maps an unknown code, a plain error or a network failure to 'unexpected'", () => {
    expect(decideErrorKey(new ConvexError({ code: "not_found" }))).toBe("unexpected");
    expect(decideErrorKey(new ConvexError({ code: "toString" }))).toBe("unexpected");
    expect(decideErrorKey(new ConvexError("forbidden"))).toBe("unexpected");
    expect(decideErrorKey(new Error("offline"))).toBe("unexpected");
    expect(decideErrorKey(undefined)).toBe("unexpected");
  });

  it("points every key at its own en.json message, and en.json has no others", () => {
    for (const code of codes) {
      expect(DECIDE_ERRORS[code]).toBe(`errors.${code}`);
      expect(t(DECIDE_ERRORS[code]), code).toMatch(/\S/);
    }
    expect(Object.keys(en.DecisionForm.errors).sort()).toEqual([...SERVER_CODES, "unexpected"].sort());
  });

  it("uses the server's note limit", () => {
    expect(NOTE_MAX_LENGTH).toBe(SERVER_NOTE_MAX_LENGTH);
  });
});
