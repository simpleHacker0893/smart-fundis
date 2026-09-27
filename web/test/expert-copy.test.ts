import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { leafStrings } from "./copy-helpers";

// The copy #41 added: the /expert pages, the decision form and the Fundi's Badge line.
const NEW_COPY = {
  ExpertPage: en.ExpertPage,
  ReviewQueue: en.ReviewQueue,
  ReviewDetail: en.ReviewDetail,
  DecisionForm: en.DecisionForm,
  badgeLine: en.AssessmentList.badgeLine,
  expertNoteLabel: en.AssessmentList.expertNoteLabel,
};

describe("#41 copy (AGENTS.md non-negotiables)", () => {
  it("never says certified: we verify; NITA, KNQA and TVETs certify", () => {
    const strings = leafStrings(NEW_COPY);
    expect(strings.length).toBeGreaterThan(40);
    for (const s of strings) expect(s, s).not.toMatch(/certif/i);
  });

  it("says 'Verified by Smart Fundis' on the Badge line", () => {
    expect(en.AssessmentList.badgeLine.startsWith("Verified by Smart Fundis — ")).toBe(true);
  });

  it("calls the AI's result a suggestion, never a decision", () => {
    expect(en.ReviewDetail.ai.title).toBe("AI suggestion — you decide");
  });

  it("W2: the queue row no longer names the AI's verdict (automation bias)", () => {
    expect((en.ReviewQueue as Record<string, unknown>).aiSuggestion).toBeUndefined();
  });

  it("never mentions the AI's confidence", () => {
    for (const s of leafStrings(NEW_COPY)) expect(s, s).not.toMatch(/confiden/i);
  });
});
