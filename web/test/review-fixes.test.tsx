import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { visibleStrings } from "./copy-helpers";

// V3 review fixes (#20-#28): Responsible AI, Standards and design reviews,
// plus the operator's contact email.

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});
vi.mock("@clerk/nextjs", () => ({
  SignIn: () => <div data-clerk="sign-in" />,
  SignUp: () => <div data-clerk="sign-up" />,
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/", redirect: () => {} }));

const webDir = fileURLToPath(new URL("..", import.meta.url));
const source = (rel: string) => readFileSync(`${webDir}/${rel}`, "utf8");

/** Every leaf of en.json with its dotted path. */
function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}
const LEAVES = leaves(en);
const get = (path: string) => LEAVES.find(([p]) => p === path)?.[1];

async function render(load: () => Promise<{ default: () => Promise<ReactNode> }>) {
  const { default: Page } = await load();
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {await Page()}
    </NextIntlClientProvider>,
  );
}
const home = () => render(() => import("@/app/(site)/page"));

function section(markup: string, id: string): string {
  const start = markup.indexOf(`id="${id}"`);
  expect(start, `no #${id}`).toBeGreaterThan(-1);
  return markup.slice(start, markup.indexOf("</section>", start));
}
const hrefs = (markup: string) => [...markup.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));

describe("copy truth (RAI review)", () => {
  it("1 BLOCKER: the Co-op is not part of consent; interest is a Coming soon dashboard toggle", async () => {
    for (const [, s] of LEAVES) expect(s).not.toMatch(/off by default|separate box/i);
    expect(get("Privacy.consent.coop")).toBe("Co-op interest is a separate 'contact me' toggle on your dashboard.");
    const consent = section(await render(() => import("@/app/(site)/privacy/page")), "consent");
    const item = consent.slice(consent.indexOf("Co-op interest"));
    expect(visibleStrings(item.slice(0, item.indexOf("</li>")))).toContain(get("Common.comingSoon"));
  });

  it("2-5: guard, where the AI runs, storage and the consent step say what is true", () => {
    expect(get("Telemetry.pipeline.stages.guard.body")).toBe("Checks length (10–90 s), resolution and light.");
    expect(get("Telemetry.hero.runs")).toBe(
      "Video AI: Smart Fundis' GPU. Feedback AI: NVIDIA's hosted API (text only, never your video).",
    );
    expect(get("ResponsibleAi.video.rows.storage.value")).toBe("Your video is kept privately.");
    expect(get("SignUp.steps.3.body")).toBe("Shown in English and Kiswahili.");
  });

  it("6: the AI's outcomes are pass, needs review and fail; a reshoot comes from the guard or an Expert", () => {
    expect(Object.keys(en.Telemetry.outputs).filter((k) => k !== "label" && k !== "title" && k !== "caption" && k !== "reshoot")).toEqual([
      "pass",
      "review",
      "fail",
    ]);
    expect(en.Telemetry.outputs.reshoot).toMatch(/guard/i);
    expect(en.Telemetry.outputs.reshoot).toMatch(/Expert/);
  });

  it("7-10: scope, readouts, what's public and softer promises", () => {
    expect(get("Landing.scope.checks.app")).toBe("Uploaded in the app, with a fresh code.");
    expect(get("Landing.badge.readout")).toBeUndefined();
    expect(get("Landing.record.readout")).toBeUndefined();
    for (const [, s] of LEAVES) expect(s).not.toMatch(/separation|\bago\b|a person reads|anyone can trust/i);
    const publicLine = "Only your badge and profile are public. Never your video.";
    expect(get("Landing.badge.body")).toBe(publicLine);
    expect(get("Privacy.hero.body")).toBe(publicLine);
    expect(get("About.principles.items.3.body")).toBe(publicLine);
    expect(get("ResponsibleAi.contact.body")).toMatch(/We read every message/);
    expect(get("About.hero.body")).toMatch(/proof clients can check/);
  });

  it("23: 'Coming soon' and 'Example' each live in one key", () => {
    expect(LEAVES.filter(([, s]) => s === "Coming soon").map(([p]) => p)).toEqual(["Common.comingSoon"]);
    expect(LEAVES.filter(([, s]) => s === "Example").map(([p]) => p)).toEqual(["Common.example"]);
  });
});

describe("Kiswahili (Architect ruling)", () => {
  it("'Kazi yako, sifa yako' appears only in the landing hero", () => {
    const paths = LEAVES.filter(([, s]) => /kazi yako|sifa yako/i.test(s)).map(([p]) => p);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) expect(p.startsWith("Landing.hero."), p).toBe(true);
  });

  it("marks it lang=sw in the h1, with the English line after it", async () => {
    const markup = await home();
    const h1 = markup.match(/<h1[\s\S]*?<\/h1>/)![0];
    expect(h1).toMatch(/lang="sw"/);
    const after = markup.slice(markup.indexOf("</h1>"));
    expect(visibleStrings(after)[0]).toBe(get("Landing.hero.english"));
  });

  it("keeps the footer draft unwired, with the reviewed wording", () => {
    const draft = JSON.parse(source("messages/drafts/sw.footer.draft.json"));
    expect(draft.Links.howVerificationWorks).toBe("Jinsi uthibitishaji unavyofanya kazi");
    expect(draft.Links.verifiedMeans).toBe("Maana ya 'kuthibitishwa'");
    expect(draft.Links.roadmap).toBe("Mipango ijayo");
    expect(draft.Links.becomeVerifier).toBe("Kuwa mthibitishaji");
    expect(existsSync(`${webDir}/messages/sw.json`)).toBe(false);
  });
});

describe("design review", () => {
  it("13 (operator override): Find a fundi goes to the real /trades page, never /#trades or /fundis", async () => {
    for (const load of [
      () => import("@/app/(site)/page"),
      () => import("@/app/(site)/evidence/page"),
      () => import("@/app/(site)/about/page"),
    ] as const) {
      const all = hrefs(await render(load));
      expect(all.some((h) => h === "/#trades" || h.startsWith("/fundis"))).toBe(false);
    }
    const home = await render(() => import("@/app/(site)/page"));
    const cta = home.match(/<a[^>]*href="\/trades"[^>]*>([\s\S]*?)<\/a>/)!;
    expect(visibleStrings(cta[1])).toContain(get("Links.findFundi"));
  });

  it("14: 'Verify now' pre-selects the trade through /join", async () => {
    const trades = section(await home(), "trades");
    expect(hrefs(trades)).toEqual(["/join?role=fundi&trade=electrical", "/join?role=fundi&trade=hairdressing"]);
    const tradesPage = section(await render(() => import("@/app/(site)/trades/page")), "open");
    expect(hrefs(tradesPage)).toEqual(["/join?role=fundi&trade=electrical", "/join?role=fundi&trade=hairdressing"]);
  });

  it("15: the landing scope offers 'Become a verifier'", async () => {
    const scope = section(await home(), "scope");
    expect(hrefs(scope)).toContain("/join?role=expert");
    expect(visibleStrings(scope)).toContain(get("Links.becomeVerifier"));
  });

  it("16: desaturates the Co-op photo to about 20%", async () => {
    const img = section(await home(), "roadmap").match(/<img[^>]*>/)![0];
    expect(img).toMatch(/saturate-20/);
  });

  it("20: bench trades without a photo show a grain strip with the trade icon", async () => {
    const bench = section(await render(() => import("@/app/(site)/trades/page")), "bench");
    const tiles = [...bench.matchAll(/<li[\s\S]*?<\/li>/g)].map((m) => m[0]);
    expect(tiles).toHaveLength(10);
    for (const tile of tiles) expect(tile, "tile has neither photo nor icon").toMatch(/<img|<svg/);
  });

  it("18: the sign-in label appears once; sign-up steps have no amber", async () => {
    const signIn = await render(() => import("@/app/(auth)/sign-in/[[...sign-in]]/page"));
    expect(visibleStrings(signIn).filter((s) => s === get("SignIn.label"))).toHaveLength(1);
    const signUp = await render(() => import("@/app/(auth)/sign-up/[[...sign-up]]/page"));
    const steps = signUp.slice(signUp.indexOf("<ol"), signUp.indexOf("</ol>"));
    expect(steps).not.toMatch(/amber/);
  });

  it("28: frame ids stay only where the frame is tagged Example", async () => {
    const about = await render(() => import("@/app/(site)/about/page"));
    const privacy = await render(() => import("@/app/(site)/privacy/page"));
    expect(about).not.toMatch(/SF-JUA/);
    expect(privacy).not.toMatch(/SF-PRV/);
    for (const [, s] of LEAVES) {
      if (/EF-3104|Privacy-01|SF-JUA/.test(s)) expect(s).toMatch(/./);
    }
    expect(get("ResponsibleAi.hero.frameTag")).toMatch(/Example/);
    const telemetry = section(await render(() => import("@/app/(site)/telemetry/page")), "privacy");
    const frame = telemetry.slice(telemetry.indexOf("<figcaption"), telemetry.indexOf("</figcaption>"));
    expect(visibleStrings(frame)).toEqual([get("Telemetry.privacy.frame"), get("Common.example")]);
  });
});

describe("standards review", () => {
  it("25: one source of truth for trades, with no type casts in the pages", async () => {
    const { TRADES, OPEN_TRADES, BENCH_TRADES } = await import("@/lib/trades");
    expect(OPEN_TRADES.map((t) => t.slug)).toEqual(["electrical", "hairdressing"]);
    expect(BENCH_TRADES).toHaveLength(10);
    expect(TRADES).toHaveLength(12);
    for (const file of ["app/(site)/page.tsx", "app/(site)/trades/page.tsx", "app/(site)/responsible-ai/page.tsx"]) {
      expect(source(file), file).not.toMatch(/\bas (never|[A-Z]\w*)\b/);
    }
    expect(source("lib/landing.ts")).not.toMatch(/LIVE_TRADES|BENCH_TRADES/);
  });

  it("26: the mailto subject comes from en.json", async () => {
    const { buildMailto } = await import("@/lib/contact");
    const href = buildMailto("info@smartfundis.com", { subject: "Smart Fundis: Fundi", message: "Habari" });
    expect(new URLSearchParams(href.split("?")[1]).get("subject")).toBe("Smart Fundis: Fundi");
    expect(get("Contact.message.subject")).toMatch(/\{role\}/);
    expect(source("lib/contact.ts")).not.toMatch(/Smart Fundis:/);
  });

  it("27: an (auth) route-group layout replaces the client FooterSwitch", () => {
    expect(existsSync(`${webDir}/app/(auth)/layout.tsx`)).toBe(true);
    expect(existsSync(`${webDir}/app/(site)/layout.tsx`)).toBe(true);
    expect(existsSync(`${webDir}/components/footer-switch.tsx`)).toBe(false);
    expect(source("app/layout.tsx")).not.toMatch(/FooterSwitch|SiteFooter/);
  });
});

describe("contact email (operator)", () => {
  it("is info@smartfundis.com and turns on the /contact mailto form", async () => {
    const { CONTACT_EMAIL } = await import("@/lib/contact");
    expect(CONTACT_EMAIL).toBe("info@smartfundis.com");
    const contact = await render(() => import("@/app/(site)/contact/page"));
    expect(contact).toMatch(/<form/);
    expect(hrefs(contact)).toContain("mailto:info@smartfundis.com");
    expect(contact).not.toMatch(/action="http|method="post"/i);
  });

  it("is in the footer as a mailto link, labelled from en.json", async () => {
    const { SiteFooter } = await import("@/components/site-footer");
    const markup = renderToStaticMarkup(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        {await SiteFooter()}
      </NextIntlClientProvider>,
    );
    expect(hrefs(markup)).toContain("mailto:info@smartfundis.com");
    const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Footer" });
    expect(visibleStrings(markup)).toContain(t("email", { email: "info@smartfundis.com" }));
  });
});
