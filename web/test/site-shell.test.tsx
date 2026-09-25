import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages, visibleStrings } from "./copy-helpers";

// The shell may only link to pages that exist today, or to sections of the
// landing page ("/#id") that exist ("nothing looks live that isn't"). This
// list is the test's own, not imported from the app.
const REAL_ROUTES = ["/", "/sign-in", "/sign-up", "/dashboard", "/evidence", "/trades", "/telemetry", "/about", "/contact", "/privacy", "/responsible-ai", "/signed-out", "/join"];

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
// Clerk's UserButton is a client widget; in tests it renders a marker plus
// its custom menu links, so we can see what the menu offers.
vi.mock("@clerk/nextjs", () => {
  const UserButton = Object.assign(
    ({ children }: { children?: ReactNode }) => <span data-clerk="user-button">{children}</span>,
    {
      MenuItems: ({ children }: { children?: ReactNode }) => <>{children}</>,
      Link: ({ label, href }: { label: string; href: string }) => (
        <a data-clerk="menu-link" href={href}>
          {label}
        </a>
      ),
      Action: () => null,
    },
  );
  return {
    useAuth: () => ({ isLoaded: clerk.isLoaded, isSignedIn: clerk.isSignedIn }),
    UserButton,
  };
});

const shell = createTranslator({ locale: defaultLocale, messages: en, namespace: "Shell" });
const footer = createTranslator({ locale: defaultLocale, messages: en, namespace: "Footer" });
const links = createTranslator({ locale: defaultLocale, messages: en, namespace: "Links" });
const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const isFromMessages = makeIsFromMessages(en);

beforeEach(() => {
  clerk.isLoaded = true;
  clerk.isSignedIn = false;
  nav.pathname = "/";
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

const PAGE_LOADERS: Record<string, () => Promise<{ default: () => Promise<ReactNode> }>> = {
  "/": () => import("@/app/page"),
  "/evidence": () => import("@/app/evidence/page"),
};

async function idsOn(route: string): Promise<Set<string>> {
  const load = PAGE_LOADERS[route];
  expect(load, `no id check for anchors on ${route}`).toBeDefined();
  const { default: Page } = await load();
  const markup = withIntl(await Page());
  return new Set([...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

function hrefs(markup: string): string[] {
  return [...markup.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
}

async function expectOnlyRealDestinations(markup: string, where: string) {
  const all = hrefs(markup);
  expect(all.length, `${where} has no links`).toBeGreaterThan(0);
  for (const href of all) {
    if (href.startsWith("#")) {
      // Same-page anchors: the skip link.
      expect(["#main-content"], `${where}: unknown anchor ${href}`).toContain(href);
      continue;
    }
    const [path, hash] = href.split("#");
    const route = path.split("?")[0];
    expect(REAL_ROUTES, `${where} links to a page that does not exist: ${href}`).toContain(route);
    if (hash !== undefined) {
      expect((await idsOn(route)).has(hash), `${where} links to a missing section: ${href}`).toBe(true);
    }
  }
}

function expectOnlyMessages(markup: string, where: string) {
  const strings = visibleStrings(markup);
  expect(strings.length).toBeGreaterThan(0);
  for (const s of strings) {
    expect(isFromMessages(s), `hardcoded string in ${where}: "${s}"`).toBe(true);
  }
}

/** The opening tag of the first element carrying `attr="value"`. */
function tagWith(markup: string, attr: string, value: string): string {
  const match = markup.match(new RegExp(`<[a-z]+[^>]*\\s${attr}="${value}"[^>]*>`));
  expect(match, `no element with ${attr}="${value}"`).not.toBeNull();
  return match![0];
}

describe("site header", () => {
  it("renders only strings from messages/en.json", async () => {
    expectOnlyMessages(await renderHeader(), "the header");
    clerk.isSignedIn = true;
    expectOnlyMessages(await renderHeader(), "the signed-in header");
  });

  it("links only to real pages and real landing sections", async () => {
    await expectOnlyRealDestinations(await renderHeader(), "the header");
    clerk.isSignedIn = true;
    await expectOnlyRealDestinations(await renderHeader(), "the signed-in header");
  });

  it("shows the nav EVIDENCE · TRADES · TELEMETRY · COMPANY at every width", async () => {
    const markup = await renderHeader();
    const navs = [...markup.matchAll(/<nav\s[^>]*>[\s\S]*?<\/nav>/g)].map((m) => m[0]);
    expect(navs).toHaveLength(2);
    for (const navMarkup of navs) {
      expect(hrefs(navMarkup)).toEqual(["/evidence", "/trades", "/telemetry", "/about", "/contact"]);
      expect(visibleStrings(navMarkup)).toContain(links("company"));
    }
    // One nav row for mobile, one inline nav for desktop: every width sees one.
    const classes = navs.map((n) => n.match(/class="([^"]*)"/)![1]);
    expect(classes.some((c) => /\blg:hidden\b/.test(c) && !/(^|\s)hidden(\s|$)/.test(c))).toBe(true);
    expect(classes.some((c) => /(^|\s)hidden(\s|$)/.test(c) && /\blg:flex\b/.test(c))).toBe(true);
  });

  it("makes COMPANY a disclosure that opens About and Contact us", async () => {
    const markup = await renderHeader();
    const buttons = [...markup.matchAll(/<button[^>]*aria-controls="([^"]+)"[^>]*>/g)];
    expect(buttons).toHaveLength(2);
    for (const [tag, panelId] of buttons) {
      expect(tag).toContain('aria-expanded="false"');
      const panel = markup.slice(markup.indexOf(`id="${panelId}"`));
      expect(hrefs(panel.slice(0, panel.indexOf("</div>") + 200)).slice(0, 2)).toEqual(["/about", "/contact"]);
    }
  });

  it("shows the lockup, the name and the VERIFIED SKILLS tag, linking home", async () => {
    const markup = await renderHeader();
    const strings = visibleStrings(markup);
    expect(strings).toContain(shell("brand"));
    expect(strings).toContain(shell("tagline"));
    expect(tagWith(markup, "aria-label", shell("homeLabel"))).toContain('href="/"');
  });

  it("offers Sign in and Join at every width when signed out", async () => {
    const markup = await renderHeader();
    for (const href of ["/sign-in", "/sign-up"]) {
      const tag = tagWith(markup, "href", href);
      expect(tag, `${href} must not be hidden on mobile`).not.toMatch(/class="([^"]*\s)?hidden(\s[^"]*)?"/);
    }
    expect(visibleStrings(markup)).toContain(links("signIn"));
    expect(markup).not.toContain('data-clerk="user-button"');
  });

  it("shows Clerk's account menu when signed in, with the dashboard in it", async () => {
    clerk.isSignedIn = true;
    const markup = await renderHeader();
    expect(markup).toContain('data-clerk="user-button"');
    expect(tagWith(markup, "data-clerk", "menu-link")).toContain('href="/dashboard"');
    expect(hrefs(markup)).not.toContain("/sign-in");
    expect(hrefs(markup)).not.toContain("/sign-up");
  });
});

describe("site footer (#27)", () => {
  it("renders only strings from messages/en.json", async () => {
    expectOnlyMessages(await renderFooter(), "the footer");
  });

  it("links only to real pages and real sections, each at most once", async () => {
    const markup = await renderFooter();
    await expectOnlyRealDestinations(markup, "the footer");
    const all = hrefs(markup);
    expect(all).toEqual([...new Set(all)]);
  });

  it("has four columns in order, each a nav labelled by its heading", async () => {
    const markup = await renderFooter();
    const navs = [...markup.matchAll(/<nav\s[^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/nav>/g)];
    expect(navs.map((m) => m[1])).toEqual(
      (["forFundis", "forClients", "forExperts", "company"] as const).map((k) => footer(`groups.${k}`)),
    );
    const linksOf = (i: number) => hrefs(navs[i][2]);
    expect(linksOf(0)).toEqual(["/join?role=fundi", "/evidence", "/privacy"]);
    expect(linksOf(1)).toEqual(["/evidence#scope"]);
    expect(linksOf(2)).toEqual(["/join?role=expert"]);
    expect(linksOf(3)).toEqual(["/about", "/contact", "/responsible-ai", "/#roadmap"]);
  });

  it("leaves out Find a fundi until /fundis exists", async () => {
    const markup = await renderFooter();
    expect(visibleStrings(markup)).not.toContain(links("findFundi"));
    expect(hrefs(markup).some((h) => h.startsWith("/fundis"))).toBe(false);
  });

  it("drops the wordmark and the CTA band; keeps one bottom line", async () => {
    const markup = await renderFooter();
    const strings = visibleStrings(markup);
    expect(strings).not.toContain(shell("brand"));
    expect(strings.join(" ")).not.toMatch(/show your work/i);
    expect(strings).toContain(footer("bottomLine"));
    expect(footer("bottomLine")).toMatch(/NITA, KNQA and TVETs certify/);
  });

  it("styles headings as 12 px amber mono, links go to white on hover", async () => {
    const markup = await renderFooter();
    for (const [h] of markup.matchAll(/<h2[^>]*>|<h3[^>]*>/g)) {
      expect(h).toMatch(/text-xs/);
      expect(h).toMatch(/text-amber/);
      expect(h).toMatch(/font-mono/);
    }
    for (const [a] of markup.matchAll(/<a\s[^>]*>/g)) {
      expect(a).toMatch(/hover:text-foreground/);
      expect(a).not.toMatch(/hover:text-amber/);
    }
  });

  it("marks the current page with aria-current and an amber underline", async () => {
    nav.pathname = "/privacy";
    const tag = tagWith(await renderFooter(), "aria-current", "page");
    expect(tag).toContain('href="/privacy"');
    expect(tag).toMatch(/decoration-amber|border-amber/);
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

  const sourceFiles = (dirs: string[], pattern: RegExp) => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const name of readdirSync(d)) {
        const full = path.join(d, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (pattern.test(name)) files.push(full);
      }
    };
    for (const d of dirs) walk(path.join(webDir, d));
    return files;
  };

  it("keeps amber as punctuation: no amber hover states (footer headings may be amber, #27)", () => {
    for (const file of sourceFiles(["components", "app"], /\.tsx?$/)) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/hover:[a-z-]*amber/);
    }
  });

  it("draws pass ticks in white, never green (HANDOFF §6)", () => {
    for (const file of sourceFiles(["components", "app"], /\.(tsx?|css)$/)) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/#10b981|emerald|green-/i);
    }
  });

  it("defines graphite, text and amber in globals.css", () => {
    expect(css.toLowerCase()).toContain("#050609");
    expect(css.toLowerCase()).toContain("#f2f4f7");
    expect(css.toLowerCase()).toContain("#ef9a57");
  });

  it("wires the next/font variables into --font-sans and --font-mono", () => {
    expect(css).toMatch(/--font-sans:[^;]*var\(--font-inter\)/);
    expect(css).toMatch(/--font-mono:[^;]*var\(--font-jetbrains-mono\)/);
  });

  it("uses no retired v1 colour or font anywhere in web/app, components, lib or messages", () => {
    const files = sourceFiles(["app", "components", "lib", "messages"], /\.(tsx?|css|json)$/);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/#0B5D3B|#F28C28|Plus[ _]Jakarta/i);
    }
  });

  it("never ships a temporary Stitch image link", () => {
    for (const file of sourceFiles(["app", "components", "lib"], /\.(tsx?|css)$/)) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/googleusercontent/);
    }
  });
});
