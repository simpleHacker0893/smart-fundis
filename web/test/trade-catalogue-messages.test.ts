import { describe, expect, it } from "vitest";
import { TRADE_ROWS, TRADE_SLUGS } from "@convex/lib/tradeCatalogue";
import en from "@/messages/en.json";
import { TRADE_TYPES } from "@/lib/trade-picker";

// The 62 Trades (#37, operator change 2): Convex stores slugs and English
// names; every name and description the user sees comes from next-intl.
// English only for now (operator, 2026-09-26); Kiswahili comes later.
const catalogue: Record<string, { name: string; description: string }> = en.TradeCatalogue;

describe("TradeCatalogue messages stay in sync with convex/lib/tradeCatalogue.ts", () => {
  it("has an English name and description for every Trade slug, and nothing else", () => {
    expect(TRADE_SLUGS).toHaveLength(62);
    expect(Object.keys(catalogue)).toEqual([...TRADE_SLUGS]);
    for (const slug of TRADE_SLUGS) {
      expect(catalogue[slug].name, slug).toMatch(/\S/);
      expect(catalogue[slug].description, slug).toMatch(/\S/);
      expect(catalogue[slug].description.length, slug).toBeLessThanOrEqual(90);
    }
  });

  it("uses the stored English name as the display name", () => {
    for (const trade of TRADE_ROWS) expect(catalogue[trade.slug].name, trade.slug).toBe(trade.name);
  });

  it("keeps every Landing trade name slug in the catalogue", () => {
    const landing = Object.keys(en.Landing.trades.names);
    expect(landing).toHaveLength(12);
    for (const slug of landing) expect(TRADE_SLUGS, slug).toContain(slug);
  });

  it("labels every type of work the catalogue uses", () => {
    const used = new Set(TRADE_ROWS.map((trade) => trade.category));
    expect([...used].sort()).toEqual([...TRADE_TYPES].sort());
    for (const type of TRADE_TYPES) expect(en.TradePicker.types[type]).toMatch(/\S/);
  });
});
