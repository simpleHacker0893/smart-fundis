import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

// Server components read copy through next-intl's getTranslations. In tests
// we back it with the real en.json so the page renders exactly what ships.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: "en", messages, namespace: namespace as never }),
  };
});

function leafStrings(value: unknown): string[] {
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
function visibleStrings(markup: string): string[] {
  const text = markup
    .split(/<[^>]*>/)
    .map((chunk) => decodeEntities(chunk).trim())
    .filter(Boolean);
  const attrs = [
    ...markup.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]*)"/g),
  ].map((match) => decodeEntities(match[1]).trim());
  return [...text, ...attrs].filter(Boolean);
}

const messageValues = new Set(leafStrings(en));

describe("home page copy", () => {
  it("renders only strings that come from messages/en.json", async () => {
    const { default: HomePage } = await import("@/app/page");
    const markup = renderToStaticMarkup(await HomePage());
    const strings = visibleStrings(markup);

    expect(strings.length).toBeGreaterThan(0);
    for (const s of strings) {
      expect(messageValues, `hardcoded string on home page: "${s}"`).toContain(s);
    }
  });

  it("shows the product name and the placeholder line", async () => {
    const { default: HomePage } = await import("@/app/page");
    const strings = visibleStrings(renderToStaticMarkup(await HomePage()));

    expect(strings).toContain(en.HomePage.title);
    expect(strings).toContain(en.HomePage.tagline);
  });

  it("takes the page title and description from messages/en.json", async () => {
    const { generateMetadata } = await import("@/app/layout");
    const metadata = await generateMetadata();

    expect(metadata.title).toBe(en.Metadata.title);
    expect(metadata.description).toBe(en.Metadata.description);
  });
});

describe("messages", () => {
  it("never says certified (we verify; NITA, KNQA and TVETs certify)", () => {
    for (const s of leafStrings(en)) {
      expect(s).not.toMatch(/certif/i);
    }
  });

  it("ships English only: no sw.json yet", () => {
    const sw = fileURLToPath(new URL("../messages/sw.json", import.meta.url));
    expect(existsSync(sw)).toBe(false);
  });
});
