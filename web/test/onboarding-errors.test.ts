import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { fieldErrorKeys, submitErrorOutcome } from "@/lib/onboarding-errors";

describe("fieldErrorKeys", () => {
  it("maps every field error code to an Onboarding.errors key", () => {
    expect(
      fieldErrorKeys({ name: "required", phone: "invalid", tradeSlugs: "unknown", county: "unknown" }),
    ).toEqual({ name: "nameRequired", phone: "phoneInvalid", tradeSlugs: "tradeRequired", county: "countyRequired" });
    expect(fieldErrorKeys({ name: "tooLong" })).toEqual({ name: "nameTooLong" });
    expect(fieldErrorKeys({ tradeSlugs: "required" })).toEqual({ tradeSlugs: "tradeRequired" });
  });

  it("returns nothing for no errors", () => {
    expect(fieldErrorKeys({})).toEqual({});
  });

  it("uses only keys that exist in en.json", () => {
    const keys = Object.values(
      fieldErrorKeys({ name: "required", phone: "invalid", tradeSlugs: "unknown", county: "unknown" }),
    ).concat(Object.values(fieldErrorKeys({ name: "tooLong" })));
    for (const key of keys) expect(en.Onboarding.errors, key).toHaveProperty(key);
  });
});

describe("submitErrorOutcome (fundiProfiles.create errors)", () => {
  it("turns `invalid` into field message keys", () => {
    const error = new ConvexError({ code: "invalid", fields: { phone: "invalid", county: "unknown" } });
    expect(submitErrorOutcome(error)).toEqual({
      kind: "invalid",
      fields: { phone: "phoneInvalid", county: "countyRequired" },
    });
  });

  it("ignores field codes it does not know, rather than showing a raw key", () => {
    const error = new ConvexError({ code: "invalid", fields: { phone: "weird", other: "x" } });
    expect(submitErrorOutcome(error)).toEqual({ kind: "invalid", fields: {} });
  });

  it("says `already_exists` means the profile is there: go on to the dashboard", () => {
    expect(submitErrorOutcome(new ConvexError({ code: "already_exists", message: "x" }))).toEqual({
      kind: "alreadyExists",
    });
  });

  it("maps `no_user` (users.store not run yet) to a retry message", () => {
    expect(submitErrorOutcome(new ConvexError({ code: "no_user" }))).toEqual({ kind: "form", key: "noUser" });
  });

  it("maps anything else to the generic failure", () => {
    for (const error of [new Error("network"), new ConvexError({ code: "nope" }), new ConvexError("text"), null]) {
      expect(submitErrorOutcome(error)).toEqual({ kind: "form", key: "failed" });
    }
  });

  it("uses form keys that exist in en.json", () => {
    expect(en.Onboarding.errors).toHaveProperty("noUser");
    expect(en.Onboarding.errors).toHaveProperty("failed");
  });
});
