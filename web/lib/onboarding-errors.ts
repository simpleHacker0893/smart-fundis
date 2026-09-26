import { ConvexError } from "convex/values";
import type { FundiProfileErrors } from "@convex/lib/fundiProfile";

export const PROFILE_FIELDS = ["name", "phone", "tradeSlug", "county"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

// Every field error code (convex/lib/fundiProfile.ts) mapped to its
// Onboarding.errors key. `satisfies` fails the build if a code is added there
// without a key here.
const FIELD_ERROR_KEYS = {
  name: { required: "nameRequired", tooLong: "nameTooLong" },
  phone: { invalid: "phoneInvalid" },
  tradeSlug: { unknown: "tradeRequired" },
  county: { unknown: "countyRequired" },
} as const satisfies { [F in ProfileField]: Record<NonNullable<FundiProfileErrors[F]>, string> };

export type FieldErrorKey = {
  [F in ProfileField]: (typeof FIELD_ERROR_KEYS)[F][keyof (typeof FIELD_ERROR_KEYS)[F]];
}[ProfileField];
export type FormErrorKey = "noUser" | "failed";
export type FieldErrorKeys = Partial<Record<ProfileField, FieldErrorKey>>;

/** The Onboarding.errors key for each field error, skipping codes it does not know. */
export function fieldErrorKeys(errors: Record<string, unknown>): FieldErrorKeys {
  const keys: FieldErrorKeys = {};
  for (const field of PROFILE_FIELDS) {
    const code = errors[field];
    const byCode: Partial<Record<string, FieldErrorKey>> = FIELD_ERROR_KEYS[field];
    const key = typeof code === "string" && Object.hasOwn(byCode, code) ? byCode[code] : undefined;
    if (key) keys[field] = key;
  }
  return keys;
}

export type SubmitErrorOutcome =
  | { kind: "invalid"; fields: FieldErrorKeys }
  | { kind: "alreadyExists" }
  | { kind: "form"; key: FormErrorKey };

/**
 * What the onboarding form does with an error from `fundiProfiles.create`:
 * show field errors, move on (the profile already exists), or show one
 * form-level message. Anything unexpected is the generic failure.
 */
export function submitErrorOutcome(error: unknown): SubmitErrorOutcome {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    const data = error.data as { code?: unknown; fields?: unknown };
    if (data.code === "invalid") {
      const fields = typeof data.fields === "object" && data.fields !== null ? data.fields : {};
      return { kind: "invalid", fields: fieldErrorKeys(fields as Record<string, unknown>) };
    }
    if (data.code === "already_exists") return { kind: "alreadyExists" };
    if (data.code === "no_user") return { kind: "form", key: "noUser" };
  }
  return { kind: "form", key: "failed" };
}
