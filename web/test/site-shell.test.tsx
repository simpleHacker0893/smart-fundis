import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { leafStrings, visibleStrings } from "./copy-helpers";

// The shell may only link to pages that exist today ("nothing looks live that
// isn't"). This list is the test's own, not imported from the app, so the app
// cannot widen it by accident. Add a route here only when its page ships.
const REAL_ROUTES = ["/", "/sign-in", "/sign-up", "/dashboard"];

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const clerk = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: clerk.isLoaded, isSignedIn: clerk.isSignedIn }),
}));

const shell = createTranslator({ locale: defaultLocale, messages: en, namespace: "Shell" });
const footer = createTranslator({ locale: defaultLocale, messages: en, namespace: "Footer" });
const messageValues = new Set(leafStrings(en));

beforeEach(() => {
  clerk.isLoaded = true;
  clerk.isSignedIn = false;
});

function withIntl(node: ReactNode) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {node}
    </NextIntlClientProvider>,
  );
}

async function renderHeader() {
  const { SiteHeader } = await import("@/components/site-header");
  return withIntl(await SiteHeader());
}

async function renderFooter() {
  const { SiteFooter } = await import("@/components/site-footer");
  return withIntl(await SiteFooter());
}

function hrefs(markup: string): string[] {
  return [...markup.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
}

function expectOnlyRealRoutes(markup: string, where: string) {
  const links = hrefs(markup);
  expect(links.length, `${where} has no links`).toBeGreaterThan(0);
  for (const href of links) {
    // Same-page anchors (the skip link) are fine; everything else must be a real page.
    if (href.startsWith("#")) continue;
    expect(REAL_ROUTES, `${where} links to a page that does not exist: ${href}`).toContain(href);
  }
}

function expectOnlyMessages(markup: string, where: string) {
  const strings = visibleStrings(markup);
  expect(strings.length).toBeGreaterThan(0);
  for (const s of strings) {
    expect(messageValues, `hardcoded string in ${where}: "${s}"`).toContain(s);
  }
}

/** The opening tag of the first element carrying `attr="value"`. */
function tagWith(markup: string, attr: string, value: string): string {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markup.match(new RegExp(`<[a-z]+[^>]*\\s${attr}="${escaped}"[^>]*>`));
  expect(match, `no element with ${attr}="${value}"`).not.toBeNull();
  return match![0];
}

describe("site header", () => {
  it("renders only strings from messages/en.json", async () => {
    expectOnlyMessages(await renderHeader(), "the header");
    clerk.isSignedIn = true;
    expectOnlyMessages(await renderHeader(), "the signed-in header");
  });

  it("links only to pages that exist", async () => {
    expectOnlyRealRoutes(await renderHeader(), "the header");
    clerk.isSignedIn = true;
    expectOnlyRealRoutes(await renderHeader(), "the signed-in header");
  });

  it("shows the wordmark linking home, the JOIN pill and Sign in when signed out", async () => {
    const markup = await renderHeader();
    const strings = visibleStrings(markup);

    expect(strings).toContain(shell("brand"));
    expect(strings).toContain(shell("join"));
    expect(strings).toContain(shell("signIn"));
    expect(strings).toContain(shell("joinAsFundi"));
    expect(hrefs(markup)).toContain("/");
    expect(hrefs(markup)).toContain("/sign-in");
    expect(hrefs(markup)).toContain("/sign-up");
    expect(hrefs(markup)).not.toContain("/dashboard");
  });

  it("gives the compact JOIN pill an accessible name that contains its visible text", async () => {
    const tag = tagWith(await renderHeader(), "aria-label", shell("joinAsFundi"));
    expect(tag).toContain('href="/sign-up"');
    expect(shell("joinAsFundi").toLowerCase()).toContain(shell("join").toLowerCase());
  });

  it("swaps Sign in and Join for a Dashboard link when signed in", async () => {
    clerk.isSignedIn = true;
    const markup = await renderHeader();

    expect(visibleStrings(markup)).toContain(shell("dashboard"));
    expect(hrefs(markup)).toContain("/dashboard");
    expect(hrefs(markup)).not.toContain("/sign-in");
    expect(hrefs(markup)).not.toContain("/sign-up");
  });

  it("has a labelled menu button that reports it is closed", async () => {
    const tag = tagWith(await renderHeader(), "aria-label", shell("openMenu"));
    expect(tag).toMatch(/^<button/);
    expect(tag).toContain('aria-expanded="false"');
    expect(tag).toContain('aria-haspopup="dialog"');
  });

  it("leaves out nav items whose pages are not built yet (Evidence, Trades, Telemetry, Company)", async () => {
    const strings = visibleStrings(await renderHeader());
    for (const key of ["evidence", "trades", "telemetry", "company", "about", "contact"] as const) {
      expect(strings).not.toContain(shell(`nav.${key}`));
    }
  });
});

describe("site footer", () => {
  it("renders only strings from messages/en.json", async () => {
    expectOnlyMessages(await renderFooter(), "the footer");
  });

  it("links only to pages that exist", async () => {
    expectOnlyRealRoutes(await renderFooter(), "the footer");
  });

  it("shows the headline, the Join CTA, the wordmark and the legal lines", async () => {
    const markup = await renderFooter();
    const strings = visibleStrings(markup);

    expect(strings).toContain(footer("headline"));
    expect(strings).toContain(footer("cta.joinAsFundi"));
    expect(strings).toContain(footer("wordmark"));
    expect(strings).toContain(footer("legal"));
    expect(strings).toContain(footer("copyright"));
    expect(hrefs(markup)).toContain("/sign-up");
  });

  it("leaves out links to pages that are not built yet", async () => {
    const strings = visibleStrings(await renderFooter());
    for (const key of [
      "howVerificationWorks",
      "privacy",
      "findFundi",
      "verifiedMeans",
      "becomeVerifier",
      "about",
      "contact",
      "responsibleAi",
      "roadmap",
    ] as const) {
      expect(strings).not.toContain(footer(`links.${key}`));
    }
    expect(strings).not.toContain(footer("cta.findFundi"));
  });

  it("drops a link group that has no built links", async () => {
    const strings = visibleStrings(await renderFooter());
    expect(strings).toContain(footer("groups.forFundis"));
    for (const key of ["forClients", "forExperts", "company"] as const) {
      expect(strings).not.toContain(footer(`groups.${key}`));
    }
  });
});

describe("real routes", () => {
  const appDir = fileURLToPath(new URL("../app", import.meta.url));

  it.each(REAL_ROUTES)("%s has a page in web/app", (route) => {
    const dir = path.join(appDir, ...route.split("/").filter(Boolean));
    expect(existsSync(dir), `${route} has no folder in app/`).toBe(true);
    const hasPage = (d: string): boolean =>
      readdirSync(d).some((name) => {
        const full = path.join(d, name);
        if (name === "page.tsx") return true;
        // Optional catch-alls such as [[...sign-in]] serve the bare route.
        return name.startsWith("[[...") && statSync(full).isDirectory() && hasPage(full);
      });
    expect(hasPage(dir), `${route} has no page.tsx`).toBe(true);
  });

  it("the app's own list of built routes matches this allow-list", async () => {
    const { BUILT_ROUTES } = await import("@/lib/site-nav");
    expect([...BUILT_ROUTES].sort()).toEqual([...REAL_ROUTES].sort());
  });
});

describe("Instrument theme (D-9)", () => {
  const webDir = fileURLToPath(new URL("..", import.meta.url));
  const css = readFileSync(path.join(webDir, "app", "globals.css"), "utf8");

  it("defines graphite, text and amber in globals.css", () => {
    expect(css.toLowerCase()).toContain("#050609");
    expect(css.toLowerCase()).toContain("#f2f4f7");
    expect(css.toLowerCase()).toContain("#ef9a57");
  });

  it("wires the next/font variables into --font-sans and --font-mono", () => {
    expect(css).toMatch(/--font-sans:[^;]*var\(--font-inter\)/);
    expect(css).toMatch(/--font-mono:[^;]*var\(--font-jetbrains-mono\)/);
  });

  it("uses no retired v1 colour or font anywhere in web/app, web/components or web/lib", () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const name of readdirSync(d)) {
        const full = path.join(d, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(tsx?|css|json)$/.test(name)) files.push(full);
      }
    };
    for (const d of ["app", "components", "lib", "messages"]) walk(path.join(webDir, d));

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/#0B5D3B|#F28C28|Plus[ _]Jakarta/i);
    }
  });
});
