import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import { leafStrings, visibleStrings } from "./copy-helpers";

// Server components read copy through next-intl's getTranslations. In tests
// we back it with the real en.json so the page renders exactly what ships.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

// The layout loads its fonts through next/font, which only runs inside Next.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var", className: "font-inter" }),
  JetBrains_Mono: () => ({ variable: "font-mono-var", className: "font-mono" }),
}));

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
    // HANDOFF §5: the only allowed use of the word is this exact sentence.
    const allowed = "NITA, KNQA and TVETs certify.";
    for (const s of leafStrings(en)) {
      expect(s.replaceAll(allowed, "")).not.toMatch(/certif/i);
    }
  });

  it("ships English only: no sw.json yet", () => {
    const sw = fileURLToPath(new URL("../messages/sw.json", import.meta.url));
    expect(existsSync(sw)).toBe(false);
  });
});
