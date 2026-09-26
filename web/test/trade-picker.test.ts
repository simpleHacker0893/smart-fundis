import { describe, expect, it } from "vitest";
import { matchesQuery, selectedTrades, toggleSlug, visibleTrades, type PickerTrade } from "@/lib/trade-picker";

const TRADES: PickerTrade[] = [
  { slug: "electrical", name: "Electrical", category: "skilled", verifyNow: true },
  { slug: "plumbing", name: "Plumbing", category: "skilled", verifyNow: false },
  { slug: "paving", name: "Cabro & paving", category: "semi_skilled", verifyNow: false },
  { slug: "mamaFua", name: "Mama fua (laundry)", category: "odd_job", verifyNow: false },
  { slug: "autoElectrical", name: "Auto electrical", category: "skilled", verifyNow: false },
];
const SW: Record<string, string> = {
  electrical: "Fundi umeme",
  plumbing: "Fundi bomba",
  paving: "Fundi cabro",
  mamaFua: "Mama fua (kufua nguo)",
  autoElectrical: "Fundi umeme wa magari",
};
const namesOf = (t: PickerTrade) => [t.name, SW[t.slug] ?? ""];
const slugs = (list: readonly PickerTrade[]) => list.map((t) => t.slug);

describe("visibleTrades (#37 onboarding picker)", () => {
  it("shows only the chosen type of work, in catalogue order, when there is no search", () => {
    expect(slugs(visibleTrades(TRADES, { type: "skilled", query: "", namesOf }))).toEqual([
      "electrical",
      "plumbing",
      "autoElectrical",
    ]);
    expect(slugs(visibleTrades(TRADES, { type: "odd_job", query: "  ", namesOf }))).toEqual(["mamaFua"]);
  });

  it("searches every type of work by English name", () => {
    expect(slugs(visibleTrades(TRADES, { type: "odd_job", query: "paving", namesOf }))).toEqual(["paving"]);
    expect(slugs(visibleTrades(TRADES, { type: "odd_job", query: "ELECTRICAL", namesOf }))).toEqual([
      "electrical",
      "autoElectrical",
    ]);
  });

  it("matches any of the names namesOf gives a Trade", () => {
    expect(slugs(visibleTrades(TRADES, { type: "odd_job", query: "bomba", namesOf }))).toEqual(["plumbing"]);
    expect(slugs(visibleTrades(TRADES, { type: "skilled", query: "umeme magari", namesOf }))).toEqual([
      "autoElectrical",
    ]);
  });

  it("returns nothing when no name matches", () => {
    expect(visibleTrades(TRADES, { type: "skilled", query: "astronaut", namesOf })).toEqual([]);
  });
});

describe("matchesQuery", () => {
  it("ignores case, accents, punctuation and word order", () => {
    expect(matchesQuery(["Mama fua (laundry)"], "LAUNDRY")).toBe(true);
    expect(matchesQuery(["Café & paving"], "cafe")).toBe(true);
    expect(matchesQuery(["Fundi umeme wa magari"], "magari umeme")).toBe(true);
    expect(matchesQuery(["Fundi bomba"], "bomba umeme")).toBe(false);
  });
});

describe("selection", () => {
  it("toggles a slug in and out", () => {
    expect(toggleSlug([], "plumbing")).toEqual(["plumbing"]);
    expect(toggleSlug(["plumbing", "electrical"], "plumbing")).toEqual(["electrical"]);
  });

  it("lists the selected Trades in catalogue order, whatever type of work is showing", () => {
    expect(slugs(selectedTrades(TRADES, ["mamaFua", "electrical"]))).toEqual(["electrical", "mamaFua"]);
  });
});
