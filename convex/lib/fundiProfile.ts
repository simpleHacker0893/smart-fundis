import { cleanLine } from "./contact";
import { canonicalCounty } from "./counties";
import { normalizeKenyanPhone } from "./phone";
import { TRADE_CATALOGUE } from "./trades";

// Rules for the minimal Fundi profile form (#37). fundiProfiles.create
// enforces them on the server, and the web form can import the same function
// for its inline errors. No database access here: each Trade is checked
// against the trades table by the mutation.

export const FUNDI_PROFILE_LIMITS = {
  nameMax: 80,
  // Hard cap on any raw argument (string length, or tradeSlugs entries),
  // checked before any normalisation.
  rawMax: 200,
  // A Fundi may declare any catalogue Trade (operator change 2 on #37), at
  // least one, so the cap is the catalogue length.
  tradesMax: TRADE_CATALOGUE.length,
} as const;

export type FundiProfileInput = {
  name: string;
  phone: string;
  tradeSlugs: string[];
  county: string;
};

/** Field error codes; the web maps each to a next-intl key. */
export type FundiProfileErrors = Partial<{
  name: "required" | "tooLong";
  phone: "invalid";
  // required: no Trade chosen. unknown: a malformed slug or more than
  // tradesMax; fundiProfiles.create also uses it for a slug not in `trades`.
  tradeSlugs: "required" | "unknown";
  county: "unknown";
}>;

/** Same shape as the input, but every value has been cleaned. */
export type CleanFundiProfile = FundiProfileInput;

/**
 * Cleans the input: a one-line trimmed name, the phone as +254XXXXXXXXX, the
 * county's canonical name and the Trade slugs trimmed, with blanks dropped
 * and duplicates removed (first one kept). Returns the errors, and the clean
 * values only when there are none.
 */
export function parseFundiProfile(
  input: FundiProfileInput,
): { ok: true; value: CleanFundiProfile } | { ok: false; errors: FundiProfileErrors } {
  const errors: FundiProfileErrors = {};
  const { rawMax, nameMax } = FUNDI_PROFILE_LIMITS;

  const name = input.name.length > rawMax ? null : cleanLine(input.name);
  if (name === null || name.length > nameMax) errors.name = "tooLong";
  else if (name.length === 0) errors.name = "required";

  const phone = input.phone.length > rawMax ? null : normalizeKenyanPhone(input.phone);
  if (phone === null) errors.phone = "invalid";

  const county = input.county.length > rawMax ? null : canonicalCounty(input.county);
  if (county === null) errors.county = "unknown";

  const tradeSlugs = cleanTradeSlugs(input.tradeSlugs);
  if (tradeSlugs === null) errors.tradeSlugs = "unknown";
  else if (tradeSlugs.length === 0) errors.tradeSlugs = "required";

  if (Object.keys(errors).length > 0 || name === null || phone === null || county === null || tradeSlugs === null) {
    return { ok: false, errors };
  }
  return { ok: true, value: { name, phone, tradeSlugs, county } };
}

/** Trimmed, non-blank, de-duplicated slugs; null when any limit is broken. */
export function cleanTradeSlugs(raw: string[]): string[] | null {
  const { rawMax, tradesMax } = FUNDI_PROFILE_LIMITS;
  if (raw.length > rawMax || raw.some((slug) => slug.length > rawMax)) return null;
  const slugs = [...new Set(raw.map((slug) => slug.trim()).filter((slug) => slug.length > 0))];
  return slugs.length > tradesMax ? null : slugs;
}
