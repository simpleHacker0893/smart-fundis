import { v, type Infer } from "convex/values";

// Rules for the /contact form (#29). contact.send enforces them on the server,
// and the web form imports the same functions for its inline errors, so the
// two can never disagree. No database access here.

/** The one list of roles: the schema, contact.send args and the UI use it. */
export const contactRoleValidator = v.union(
  v.literal("client"),
  v.literal("fundi"),
  v.literal("expert"),
  v.literal("other"),
);
export type ContactRole = Infer<typeof contactRoleValidator>;
export const CONTACT_ROLES: readonly ContactRole[] = contactRoleValidator.members.map((m) => m.value);

export const CONTACT_LIMITS = {
  nameMax: 80,
  topicMax: 120,
  messageMin: 10,
  messageMax: 2000,
  emailMax: 254,
} as const;

/**
 * Hard caps on the raw arguments, checked before any parsing or regex work.
 * Generous on purpose (whitespace and invisible characters are cleaned later),
 * but far below anything that could make normalisation expensive.
 */
export const RAW_ARG_CAPS = {
  name: 1_000,
  contact: 1_000,
  topic: 1_000,
  message: 10_000,
  website: 1_000,
} as const;

export type ContactInput = {
  name: string;
  contact: string;
  role: string;
  topic: string;
  message: string;
};

export type ContactErrors = Partial<{
  name: "required" | "tooLong";
  contact: "required" | "invalid";
  role: "invalid";
  topic: "required" | "tooLong";
  message: "required" | "tooShort" | "tooLong";
}>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRINTABLE_ASCII = /^[\x21-\x7E]+$/;
// Kenyan mobile numbers: 07XX / 01XX locally, or +254 / 254 with the leading 0 dropped.
const KENYAN_PHONE = /^(?:\+254|254|0)([17]\d{8})$/;
// Format characters (Cf): zero-width space/joiners, BOM, word joiner, bidi marks.
const FORMAT_CHARS = /\p{Cf}/gu;
const CONTROL_CHARS = /\p{Cc}/gu;

/** True when any raw argument is over its hard cap. */
export function exceedsRawCaps(args: Partial<Record<keyof typeof RAW_ARG_CAPS, string>>): boolean {
  return (Object.keys(RAW_ARG_CAPS) as (keyof typeof RAW_ARG_CAPS)[]).some(
    (key) => (args[key]?.length ?? 0) > RAW_ARG_CAPS[key],
  );
}

/** A one-line field (name, topic): no control or format characters, no newlines. */
export function cleanLine(raw: string): string {
  return raw
    .replace(/[\r\n\t]+/g, " ")
    .replace(CONTROL_CHARS, "")
    .replace(FORMAT_CHARS, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

/** The message: keeps newlines and tabs, drops other control and format characters. */
export function cleanMessage(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, (c) => (c === "\n" || c === "\t" ? c : ""))
    .replace(FORMAT_CHARS, "")
    .trim();
}

/**
 * The contact as stored: NFKC-folded (so full-width lookalikes become ASCII),
 * invisible characters removed, then a lowercased ASCII email or a Kenyan
 * phone as +254XXXXXXXXX. Returns null when it is neither.
 */
export function normalizeContact(raw: string): string | null {
  const value = raw.normalize("NFKC").replace(FORMAT_CHARS, "").trim();
  if (value.includes("@")) {
    const email = value.toLowerCase();
    const ok = email.length <= CONTACT_LIMITS.emailMax && PRINTABLE_ASCII.test(email) && EMAIL.test(email);
    return ok ? email : null;
  }
  const digits = value.replace(/[\s\-()]/g, "");
  const match = KENYAN_PHONE.exec(digits);
  return match ? `+254${match[1]}` : null;
}

/**
 * The throttle key: the normalised contact with email sub-addresses folded
 * ("a+tag@x" is "a@x"), and Gmail's ignored dots removed. Stored separately
 * from `contact`, which keeps the address exactly as we should reply to it.
 */
export function contactKey(raw: string): string | null {
  const contact = normalizeContact(raw);
  if (contact === null || !contact.includes("@")) return contact;
  const at = contact.lastIndexOf("@");
  let local = contact.slice(0, at);
  let domain = contact.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replaceAll(".", "") || local;
  return `${local}@${domain}`;
}

export function isContactRole(role: string): role is ContactRole {
  return (CONTACT_ROLES as readonly string[]).includes(role);
}

/** Field-by-field errors, after cleaning; an empty object means valid. */
export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = cleanLine(input.name);
  const contact = input.contact.trim();
  const topic = cleanLine(input.topic);
  const message = cleanMessage(input.message);

  if (!name) errors.name = "required";
  else if (name.length > CONTACT_LIMITS.nameMax) errors.name = "tooLong";

  if (!contact) errors.contact = "required";
  else if (normalizeContact(contact) === null) errors.contact = "invalid";

  if (!isContactRole(input.role)) errors.role = "invalid";

  if (!topic) errors.topic = "required";
  else if (topic.length > CONTACT_LIMITS.topicMax) errors.topic = "tooLong";

  if (!message) errors.message = "required";
  else if (message.length < CONTACT_LIMITS.messageMin) errors.message = "tooShort";
  else if (message.length > CONTACT_LIMITS.messageMax) errors.message = "tooLong";

  return errors;
}
