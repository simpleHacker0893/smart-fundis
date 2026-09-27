import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { leafStrings } from "./copy-helpers";

// The copy #42 added: the public /f/[id] profile and its 404.
describe("#42 public profile copy (AGENTS.md non-negotiables, CONTEXT)", () => {
  it("never says certified: we verify; NITA, KNQA and TVETs certify", () => {
    const strings = leafStrings(en.PublicProfile);
    expect(strings.length).toBeGreaterThan(8);
    for (const s of strings) expect(s, s).not.toMatch(/certif/i);
  });

  it("uses the same Badge line as the Fundi's own list", () => {
    expect(en.PublicProfile.badgeLine).toBe(en.AssessmentList.badgeLine);
    expect(en.PublicProfile.badgeLine).toBe("Verified by Smart Fundis — {trade}: {task} · {date}");
  });

  it("uses the CONTEXT labels exactly", () => {
    expect(en.PublicProfile.notYetVerified).toBe("Not yet verified");
    expect(en.PublicProfile.demoTag).toBe("Demo: not a real verification");
  });

  it("never uses the CONTEXT aliases for Not yet verified", () => {
    for (const s of leafStrings(en.PublicProfile)) expect(s, s).not.toMatch(/unverified|unapproved|pending|failed/i);
  });

  it("RAI: the upload consent says what the public profile shows (consent-v1, never shipped)", () => {
    const text =
      "Your Badges, name, county and trades are on your public profile. Your video and the review notes stay private.";
    expect(en.UploadFlow.consent.points.public).toBe(text);
    expect(en.Privacy.consent.points.badge).toBe(text);
  });

  it("RAI nit: the declared Trades never read as verified", () => {
    expect(en.PublicProfile.tradesTitle).toBe("Trades (declared by the Fundi)");
  });
});
