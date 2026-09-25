import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The layout's composition only: providers pass through, and the async
// header and footer (tested in site-shell.test.tsx) become markers.
vi.mock("next-intl/server", () => ({ getTranslations: async () => () => "" }));
vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/convex-client-provider", () => ({
  ConvexClientProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => <header data-shell="header" /> }));
vi.mock("@/components/site-footer", () => ({ SiteFooter: () => <footer data-shell="footer" /> }));
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter-var", className: "font-inter" }),
  JetBrains_Mono: () => ({ variable: "font-mono-var", className: "font-mono" }),
}));

describe("root layout", () => {
  it("wraps every page in the site header and footer", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const markup = renderToStaticMarkup(RootLayout({ children: <p data-page="child" /> }));

    const header = markup.indexOf('data-shell="header"');
    const child = markup.indexOf('data-page="child"');
    const footer = markup.indexOf('data-shell="footer"');
    expect(header).toBeGreaterThan(-1);
    expect(child).toBeGreaterThan(header);
    expect(footer).toBeGreaterThan(child);
  });

  it("is dark-only and carries both next/font variables on <html>", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const markup = renderToStaticMarkup(RootLayout({ children: null }));
    const html = markup.match(/<html[^>]*>/)![0];

    expect(html).toMatch(/class="[^"]*\bdark\b/);
    expect(html).toContain("font-inter-var");
    expect(html).toContain("font-mono-var");
  });

  it("gives the skip-link target a scroll margin for the 92 / 72 px sticky header", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const markup = renderToStaticMarkup(RootLayout({ children: null }));
    const target = markup.match(/<[a-z]+[^>]*id="main-content"[^>]*>/)![0];

    expect(target).toContain("scroll-mt-24");
    expect(target).toContain("lg:scroll-mt-[72px]");
  });

  it("uses a theme colour equal to --bg in globals.css (meta tags cannot read CSS variables)", async () => {
    const { viewport } = await import("@/app/layout");
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const bg = css.match(/--bg:\s*(#[0-9a-fA-F]{6})/)![1];

    expect(String(viewport.themeColor).toLowerCase()).toBe(bg.toLowerCase());
  });
});
