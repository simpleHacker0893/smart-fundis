// Kenyan mobile numbers: 07XX / 01XX locally, or +254 / 254 with the leading 0
// dropped. Shared by the /contact form and the Fundi profile form.
const KENYAN_PHONE = /^(?:\+254|254|0)([17]\d{8})$/;
// Format characters (Cf): zero-width space/joiners, BOM, word joiner, bidi marks.
const FORMAT_CHARS = /\p{Cf}/gu;

/**
 * A Kenyan mobile number as +254XXXXXXXXX, or null when the input is not one.
 * NFKC-folds first (full-width digits become ASCII), and ignores spaces,
 * dashes, brackets and invisible characters.
 */
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw
    .normalize("NFKC")
    .replace(FORMAT_CHARS, "")
    .replace(/[\s\-()]/g, "");
  const match = KENYAN_PHONE.exec(digits);
  return match ? `+254${match[1]}` : null;
}
