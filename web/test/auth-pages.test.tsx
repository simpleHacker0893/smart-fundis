import { readFileSync } from "node:fs";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages, visibleStrings } from "./copy-helpers";

// #28: the auth pages are Stitch chrome around Clerk's own widgets. Clerk's
// widgets are replaced by markers that record the props they receive.

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const clerk = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: Record<string, unknown>) => {
    clerk.props.SignIn = props;
    return <div data-clerk="sign-in" />;
  },
  SignUp: (props: Record<string, unknown>) => {
    clerk.props.SignUp = props;
    return <div data-clerk="sign-up" />;
  },
}));

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const isFromMessages = makeIsFromMessages(en);
const REAL_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/dashboard",
  "/evidence",
  "/trades",
  "/telemetry",
  "/about",
  "/contact",
  "/privacy",
  "/responsible-ai",
  "/signed-out",
];

const PAGES = {
  "/sign-in": { load: () => import("@/app/sign-in/[[...sign-in]]/page"), namespace: "SignIn", widget: "sign-in" },
  "/sign-up": { load: () => import("@/app/sign-up/[[...sign-up]]/page"), namespace: "SignUp", widget: "sign-up" },
  "/signed-out": { load: () => import("@/app/signed-out/page"), namespace: "SignedOut", widget: null },
} as const;

async function render(route: keyof typeof PAGES) {
  const page = await PAGES[route].load();
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {await page.default()}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  clerk.props = {};
  nav.pathname = "/";
});

describe.each(Object.keys(PAGES) as (keyof typeof PAGES)[])("%s (#28)", (route) => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: PAGES[route].namespace });

  it("renders only strings from en.json, with one h1", async () => {
    const markup = await render(route);
    const strings = visibleStrings(markup);
    expect(strings.length).toBeGreaterThan(3);
    for (const s of strings) expect(isFromMessages(s), `hardcoded string on ${route}: "${s}"`).toBe(true);
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(visibleStrings(markup)).toContain(t("title"));
  });

  it("takes its title and description from en.json", async () => {
    const meta = await (await PAGES[route].load()).generateMetadata();
    expect(meta.title).toBe(t("meta.title"));
    expect(meta.description).toBe(t("meta.description"));
  });

  it("links only to real routes and uses a local WebP photo with alt text", async () => {
    const markup = await render(route);
    for (const href of [...markup.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1])) {
      expect(REAL_ROUTES, `${route} links to a missing page: ${href}`).toContain(href.split("#")[0] || route);
    }
    const imgs = [...markup.matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toMatch(/\.webp/);
    expect(imgs[0]).toMatch(/\salt="[^"]+"/);
  });

  if (PAGES[route].widget) {
    it("renders Clerk's own widget, not a rebuilt form", async () => {
      const markup = await render(route);
      expect(markup).toContain(`data-clerk="${PAGES[route].widget}"`);
      expect(markup).not.toMatch(/<form|<input/);
    });
  }
});

describe("/sign-up (#28)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "SignUp" });

  it("tags the onboarding steps that aren't built yet 'Coming soon'", async () => {
    const markup = await render("/sign-up");
    const steps = [...markup.matchAll(/<li[\s\S]*?<\/li>/g)].map((m) => visibleStrings(m[0]));
    expect(steps).toHaveLength(4);
    expect(steps[0]).not.toContain(t("comingSoon"));
    for (const step of steps.slice(1)) expect(step).toContain(t("comingSoon"));
  });
});

describe("/signed-out (#28)", () => {
  it("offers Sign in again and Back to home", async () => {
    const hrefs = [...(await render("/signed-out")).matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/sign-in", "/"]);
  });
});

describe("footer switch", () => {
  async function renderSwitch() {
    const { FooterSwitch } = await import("@/components/footer-switch");
    return renderToStaticMarkup(<FooterSwitch full={<footer data-footer="full" />} slim={<footer data-footer="slim" />} />);
  }

  it("uses the slim legal footer on the auth pages, the full footer elsewhere", async () => {
    for (const pathname of ["/sign-in", "/sign-in/factor-one", "/sign-up", "/signed-out"]) {
      nav.pathname = pathname;
      expect(await renderSwitch(), pathname).toContain('data-footer="slim"');
    }
    for (const pathname of ["/", "/evidence", "/signed-outside"]) {
      nav.pathname = pathname;
      expect(await renderSwitch(), pathname).toContain('data-footer="full"');
    }
  });
});

describe("Clerk appearance in the Instrument theme (#28)", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const token = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))![1].toLowerCase();

  it("uses hex colours equal to the globals.css tokens", async () => {
    const { clerkAppearance } = await import("@/lib/clerk-appearance");
    const v = clerkAppearance.variables;
    expect(v.colorPrimary.toLowerCase()).toBe(token("amber"));
    expect(v.colorPrimaryForeground.toLowerCase()).toBe(token("bg"));
    expect(v.colorBackground.toLowerCase()).toBe(token("panel"));
    expect(v.colorForeground.toLowerCase()).toBe(token("text"));
    expect(v.colorRing.toLowerCase()).toBe(token("amber"));
    for (const value of Object.values(v)) expect(String(value)).not.toMatch(/var\(/);
  });

  it("layers Clerk's CSS under Tailwind utilities", async () => {
    const { clerkAppearance } = await import("@/lib/clerk-appearance");
    expect(clerkAppearance.cssLayerName).toBe("clerk");
    expect(css).toMatch(/@layer theme, base, clerk, components, utilities;/);
  });

  it("gives inputs and the primary button 48 px, and the primary button the only amber", async () => {
    const { clerkAppearance } = await import("@/lib/clerk-appearance");
    const e = clerkAppearance.elements;
    expect(e.formFieldInput).toMatch(/\bh-12\b/);
    expect(e.formButtonPrimary).toMatch(/\bh-12\b/);
    expect(e.socialButtonsBlockButton).toMatch(/\bh-12\b/);
    const amber = Object.entries(e).filter(([, cls]) => /amber|primary(?!-foreground)/.test(String(cls)));
    expect(amber.map(([k]) => k)).toEqual(["formButtonPrimary"]);
  });
});
