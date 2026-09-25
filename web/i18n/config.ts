// The locales the UI ships. English only for now (AGENTS.md rule 5); adding
// Kiswahili later means adding "sw" here and a messages/sw.json.
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
