// Validation for the /contact form (#29). Pure functions with no Convex
// imports: contact.send enforces them on the server, and the web form imports
// the same rules for its inline errors, so the two can never disagree.

export const CONTACT_ROLES = ["client", "fundi", "expert", "other"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const CONTACT_LIMITS = {
  nameMax: 80,
  topicMax: 120,
  messageMin: 10,
  messageMax: 2000,
  emailMax: 254,
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
// Kenyan mobile numbers: 07XX / 01XX locally, or +254 / 254 with the leading 0 dropped.
const KENYAN_PHONE = /^(?:\+254|254|0)([17]\d{8})$/;

/**
 * A lowercased email, or a Kenyan phone as +254XXXXXXXXX. Returns null when the
 * value is neither. The throttle keys on this, so "0712 345 678" and
 * "+254712345678" count as the same contact.
 */
export function normalizeContact(raw: string): string | null {
  const value = raw.trim();
  if (value.includes("@")) {
    const email = value.toLowerCase();
    return email.length <= CONTACT_LIMITS.emailMax && EMAIL.test(email) ? email : null;
  }
  const digits = value.replace(/[\s\-()]/g, "");
  const match = KENYAN_PHONE.exec(digits);
  return match ? `+254${match[1]}` : null;
}

export function isContactRole(role: string): role is ContactRole {
  return (CONTACT_ROLES as readonly string[]).includes(role);
}

/** Field-by-field errors; an empty object means the message is valid. */
export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const contact = input.contact.trim();
  const topic = input.topic.trim();
  const message = input.message.trim();

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
