import { cleanLine } from "./contact";
import { canonicalCounty } from "./counties";
import { normalizeKenyanPhone } from "./phone";

// Rules for the minimal Fundi profile form (#37). fundiProfiles.create
// enforces them on the server, and the web form can import the same function
// for its inline errors. No database access here: the Trade is checked
// against the trades table by the mutation.

export const FUNDI_PROFILE_LIMITS = {
  nameMax: 80,
  // Hard cap on any raw argument, checked before any normalisation.
  rawMax: 200,
} as const;

export type FundiProfileInput = {
  name: string;
  phone: string;
  tradeSlug: string;
  county: string;
};

/** Field error codes; the web maps each to a next-intl key. */
export type FundiProfileErrors = Partial<{
  name: "required" | "tooLong";
  phone: "invalid";
  tradeSlug: "unknown";
  county: "unknown";
}>;

/** Same shape as the input, but every value has been cleaned. */
export type CleanFundiProfile = FundiProfileInput;

/**
 * Cleans the input: a one-line trimmed name, the phone as +254XXXXXXXXX, the
 * county's canonical name and a trimmed Trade slug. Returns the errors, and
 * the clean values only when there are none.
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

  const tradeSlug = input.tradeSlug.trim();
  if (tradeSlug.length === 0 || tradeSlug.length > rawMax) errors.tradeSlug = "unknown";

  if (Object.keys(errors).length > 0 || name === null || phone === null || county === null) {
    return { ok: false, errors };
  }
  return { ok: true, value: { name, phone, tradeSlug, county } };
}
