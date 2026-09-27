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

/**
 * A rich-text leaf ("see the <contact>Contact page</contact>.") renders as
 * separate text nodes, one per piece between its tags; plain leaves pass
 * through unchanged.
 */
function richTextPieces(leaf: string): string[] {
  if (!/<\/?\w+>/.test(leaf)) return [leaf];
  return leaf
    .split(/<\/?\w+>/)
    .map((piece) => piece.trim())
    .filter(Boolean);
}

/**
 * True when `s` is copy from the messages: a leaf string as written, or a
 * leaf with ICU arguments ("Step {step} / 04") filled in, or a piece of a
 * rich-text leaf between its tags. Pure numbers and timestamps ("03",
 * "00:41") are data, not copy, so they pass too.
 */
export function makeIsFromMessages(messages: unknown): (s: string) => boolean {
  const leaves = leafStrings(messages).flatMap(richTextPieces);
  const exact = new Set(leaves);
  const templates = leaves
    .filter((leaf) => /\{\w+\}/.test(leaf))
    .map((leaf) => {
      const pattern = leaf
        .split(/\{\w+\}/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".+");
      return new RegExp(`^${pattern}$`);
    });
  // Numbers, timestamps and email addresses are data, not copy.
  return (s) =>
    exact.has(s) || templates.some((re) => re.test(s)) || /^[\d:./–\- ]+$/.test(s) || /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(s);
}
