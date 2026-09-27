import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { visibleStrings } from "./copy-helpers";

// DESIGN.md D4: the glyph for each status, and the EN column word for word.
// This table is the test's own, not imported from the app.
const EXPECTED = {
  queued: ["◌", "In line"],
  analyzing: ["◌", "AI checking"],
  awaiting_review: ["◐", "Awaiting expert review"],
  appealed: ["◐", "Appeal sent"],
  listed: ["●", "Listed"],
  listed_unverified: ["●", "Listed · Not yet verified"],
  approved: ["■", "Approved"],
  reshoot: ["↻", "Record again"],
  rejected: ["○", "Not approved"],
  listing_off: ["○", "Not showing"],
  failed: ["✕", "Error on our side"],
  hidden_by_admin: ["✕", "Hidden by Smart Fundis"],
} as const;

async function render(status: keyof typeof EXPECTED) {
  const { StatusChip } = await import("@/components/ui/status-chip");
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      <StatusChip status={status} />
    </NextIntlClientProvider>,
  );
}

describe("StatusChip (DESIGN.md D4)", () => {
  it.each(Object.entries(EXPECTED))("%s shows its glyph, hidden from screen readers, and the words", async (status, [glyph, words]) => {
    const markup = await render(status as keyof typeof EXPECTED);
    const hidden = markup.match(/<span[^>]*aria-hidden="true"[^>]*>([^<]*)<\/span>/);
    expect(hidden?.[1]).toBe(glyph);
    expect(visibleStrings(markup)).toContain(words);
  });

  it.each(Object.keys(EXPECTED))("%s is never amber, never coloured and never ✓", async (status) => {
    const markup = await render(status as keyof typeof EXPECTED);
    expect(markup).not.toMatch(/✓|✔/);
    expect(markup).not.toMatch(/amber|primary|green|red-|emerald|shadow/);
  });

  it("is a 28 px mono chip with a 1 px hairline and a 4 px radius, not a rounded-full tag", async () => {
    const markup = await render("queued");
    const chip = markup.match(/<span[^>]*>/)![0];
    for (const cls of ["min-h-7", "border", "border-line", "rounded", "font-mono", "text-xs", "tracking-[0.08em]"]) {
      expect(chip).toContain(cls);
    }
    expect(chip).not.toContain("rounded-full");
  });

  it.each(Object.keys(EXPECTED))("%s carries a stable e2e hook: data-testid and data-status on the root", async (status) => {
    const markup = await render(status as keyof typeof EXPECTED);
    const root = markup.match(/^<span[^>]*>/)![0];
    expect(root).toContain('data-testid="status-chip"');
    expect(root).toContain(`data-status="${status}"`);
  });

  it("covers every StatusChip message with a glyph", async () => {
    expect(Object.keys(en.StatusChip).sort()).toEqual(Object.keys(EXPECTED).sort());
  });
});
