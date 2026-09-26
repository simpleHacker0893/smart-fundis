/**
 * The one public contact address (operator, spec §8 "one contact email").
 * It is public, not a secret, so it lives here rather than in .env.
 */
export const CONTACT_EMAIL = "info@smartfundis.com";

/**
 * There is no message backend yet (#29 adds one), so the contact form
 * composes an email in the visitor's own mail app. The subject comes from
 * en.json (Contact.message.subject); this only encodes it.
 */
export function buildMailto(to: string, { subject, message }: { subject: string; message: string }): string {
  const params = new URLSearchParams({ subject, body: message });
  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  return `mailto:${to}?${params.toString().replaceAll("+", "%20")}`;
}
