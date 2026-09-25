export function leafStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(leafStrings);
  }
  return [];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Text nodes plus user-visible attributes (alt, aria-label, title, placeholder). */
export function visibleStrings(markup: string): string[] {
  const text = markup
    .split(/<[^>]*>/)
    .map((chunk) => decodeEntities(chunk).trim())
    .filter(Boolean);
  const attrs = [
    ...markup.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]*)"/g),
  ].map((match) => decodeEntities(match[1]).trim());
  return [...text, ...attrs].filter(Boolean);
}
