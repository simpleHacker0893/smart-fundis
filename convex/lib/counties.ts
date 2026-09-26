// The 47 counties of Kenya (Constitution of Kenya 2010, First Schedule), in
// county-code order. fundiProfiles.create checks the county against this list
// and stores the name exactly as written here. The web picker can import it.
export const KENYAN_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita-Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka-Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang'a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo-Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi",
] as const;

export type KenyanCounty = (typeof KENYAN_COUNTIES)[number];

/**
 * The canonical county name for a user's input, or null when it is not one of
 * the 47. Ignores case, extra spaces, the "County" suffix, and curly or
 * backtick apostrophes (phone keyboards type "Murang’a").
 */
export function canonicalCounty(raw: string): KenyanCounty | null {
  const key = raw
    .normalize("NFKC")
    .replace(/[\u2018\u2019`]/g, "'")
    .trim()
    .replace(/\s+county$/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return KENYAN_COUNTIES.find((c) => c.toLowerCase() === key) ?? null;
}
