import { describe, expect, it } from "vitest";
import { TRADE_TASKS } from "@convex/lib/trades";
import en from "@/messages/en.json";

// The upload picker (US-3.2) shows each Rubric from next-intl keyed by Task
// and item id, so Kiswahili can be added later (D-64). The English copy must
// stay the text the AI and the Expert work from (convex/lib/trades.ts), so a
// rai-reviewed edit there fails here until en.json follows.
describe("Rubrics messages match the seeded Rubrics", () => {
  const rubrics = en.Rubrics as Record<string, { name: string; items: Record<string, string> }>;

  it("has one entry per seeded Task, and no others", () => {
    expect(Object.keys(rubrics).sort()).toEqual(Object.values(TRADE_TASKS).map((task) => task.slug).sort());
  });

  for (const task of Object.values(TRADE_TASKS)) {
    it(`${task.slug}: the Task name and every item's text`, () => {
      const copy = rubrics[task.slug];
      expect(copy?.name).toBe(task.name);
      expect(copy?.items).toEqual(Object.fromEntries(task.items.map((item) => [item.id, item.text])));
    });
  }
});
