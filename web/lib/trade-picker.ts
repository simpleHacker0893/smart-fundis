import type { TradeCategory } from "@convex/lib/validators";

/**
 * The onboarding Trade picker's pure logic (#37, operator change 2): pick a
 * type of work, or search every Trade by name (English only for now, D-64).
 * In copy a category is a "type of work", never a "category" (CONTEXT.md).
 */

/** The dropdown's order. `satisfies` fails the build if Convex adds a category. */
export const TRADE_TYPES = ["skilled", "semi_skilled", "odd_job"] as const satisfies readonly TradeCategory[];
export type TradeType = (typeof TRADE_TYPES)[number];

/** A row of `api.trades.list`. */
export type PickerTrade = { slug: string; name: string; category: TradeCategory; verifyNow: boolean };

/** Lower case, no accents, and punctuation as spaces, so "Café &" matches "cafe". */
function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** True when one of the names contains every word of the query, in any order. */
export function matchesQuery(names: readonly string[], query: string): boolean {
  const words = normalise(query).split(" ").filter(Boolean);
  return names.some((name) => {
    const haystack = normalise(name);
    return words.every((word) => haystack.includes(word));
  });
}

/**
 * The rows to show: a search looks through every type of work; with no
 * search, only the chosen type shows. Keeps catalogue order.
 */
export function visibleTrades<T extends Pick<PickerTrade, "category">>(
  trades: readonly T[],
  { type, query, namesOf }: { type: TradeType; query: string; namesOf: (trade: T) => readonly string[] },
): T[] {
  if (normalise(query) === "") return trades.filter((trade) => trade.category === type);
  return trades.filter((trade) => matchesQuery(namesOf(trade), query));
}

export function toggleSlug(selected: readonly string[], slug: string): string[] {
  return selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug];
}

/** The selected Trades in catalogue order, from every type of work. */
export function selectedTrades<T extends Pick<PickerTrade, "slug">>(trades: readonly T[], selected: readonly string[]): T[] {
  const chosen = new Set(selected);
  return trades.filter((trade) => chosen.has(trade.slug));
}
