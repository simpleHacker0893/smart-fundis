/**
 * The one public contact address. It is null until the operator chooses one
 * (open question on #24): while it is null, /contact shows a plain readout
 * and no form, so nothing looks live that isn't. Set it here, not in .env:
 * it is public, not a secret.
 */
export const CONTACT_EMAIL: string | null = null;

/**
 * There is no backend for messages yet, so the contact form composes an
 * email in the visitor's own mail app. The subject carries their role.
 */
export function buildMailto(to: string, { role, message }: { role: string; message: string }): string {
  const params = new URLSearchParams({ subject: `Smart Fundis: ${role}`, body: message });
  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  return `mailto:${to}?${params.toString().replaceAll("+", "%20")}`;
}
