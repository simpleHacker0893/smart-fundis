import { NextIntlClientProvider, createTranslator } from "next-intl";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages, visibleStrings } from "./copy-helpers";

// The content pages of spec #19 (#21-#25). Each one gets the same checks:
// copy only from en.json, links only to real routes or real sections, images
// only local WebP, every sample tagged EXAMPLE, and nothing that says
// "certified". Page-specific checks follow.

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const REAL_ROUTES = ["/", "/sign-in", "/sign-up", "/dashboard", "/evidence", "/trades", "/telemetry", "/about", "/contact", "/privacy"];

const isFromMessages = makeIsFromMessages(en);

type PageModule = {
  default: () => Promise<ReactNode>;
  generateMetadata: () => Promise<{ title?: unknown; description?: unknown }>;
};

const PAGES: Record<string, { load: () => Promise<PageModule>; namespace: keyof typeof en }> = {
  "/evidence": { load: () => import("@/app/evidence/page"), namespace: "Evidence" },
  "/trades": { load: () => import("@/app/trades/page"), namespace: "Trades" },
  "/telemetry": { load: () => import("@/app/telemetry/page"), namespace: "Telemetry" },
  "/about": { load: () => import("@/app/about/page"), namespace: "About" },
  "/contact": { load: () => import("@/app/contact/page"), namespace: "Contact" },
  "/privacy": { load: () => import("@/app/privacy/page"), namespace: "Privacy" },
};

async function render(route: string) {
  const page = await PAGES[route].load();
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {await page.default()}
    </NextIntlClientProvider>,
  );
}

async function idsOf(route: string): Promise<Set<string>> {
  const markup = route === "/" ? await renderHome() : await render(route);
  return new Set([...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

async function renderHome() {
  const { default: HomePage } = await import("@/app/page");
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {await HomePage()}
    </NextIntlClientProvider>,
  );
}

function section(markup: string, id: string): string {
  const start = markup.indexOf(`id="${id}"`);
  expect(start, `no section #${id}`).toBeGreaterThan(-1);
  return markup.slice(start, markup.indexOf("</section>", start));
}

describe.each(Object.keys(PAGES))("%s", (route) => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: PAGES[route].namespace });

  it("renders only strings from messages/en.json", async () => {
    const strings = visibleStrings(await render(route));
    expect(strings.length).toBeGreaterThan(5);
    for (const s of strings) expect(isFromMessages(s), `hardcoded string on ${route}: "${s}"`).toBe(true);
  });

  it("has exactly one h1", async () => {
    expect((await render(route)).match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("takes its title and description from en.json", async () => {
    const meta = await (await PAGES[route].load()).generateMetadata();
    expect(meta.title).toBe(t("meta.title" as never));
    expect(meta.description).toBe(t("meta.description" as never));
  });

  it("links only to real routes and to sections that exist", async () => {
    const markup = await render(route);
    for (const href of [...markup.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1])) {
      if (href.startsWith("mailto:")) continue;
      const [path, hash] = href.split("#");
      const target = path === "" ? route : path;
      expect(REAL_ROUTES, `${route} links to a missing page: ${href}`).toContain(target);
      if (hash) expect((await idsOf(target)).has(hash), `${route} links to a missing section: ${href}`).toBe(true);
    }
  });

  it("loads only local WebP images, each with alt text", async () => {
    const imgs = [...(await render(route)).matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);
    for (const img of imgs) {
      expect(img).not.toMatch(/googleusercontent/);
      expect(img).toMatch(/\.webp/);
      expect(img).toMatch(/\salt="[^"]+"/);
    }
  });

  it("never says certified, except 'NITA, KNQA and TVETs certify'", async () => {
    const text = visibleStrings(await render(route)).join(" ");
    expect(text.replaceAll("NITA, KNQA and TVETs certify", "")).not.toMatch(/certif/i);
  });
});

describe("/evidence (#21)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Evidence" });

  it("has the prompt's sections in order: hero, chain, badge, profile, scope", async () => {
    const markup = await render("/evidence");
    const ids = ["top", "chain", "badge", "profile", "scope"];
    const at = ids.map((id) => markup.indexOf(`id="${id}"`));
    for (const [i, p] of at.entries()) expect(p, ids[i]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(visibleStrings(markup)).toContain(t("hero.title"));
  });

  it("lists the five links of the chain of evidence", async () => {
    const chain = visibleStrings(section(await render("/evidence"), "chain"));
    for (const step of ["consent", "code", "video", "ai", "expert"] as const) {
      expect(chain).toContain(t(`chain.steps.${step}.title`));
    }
  });

  it("tags the sample frame, badge and profile EXAMPLE", async () => {
    const markup = await render("/evidence");
    for (const id of ["top", "badge", "profile"]) {
      expect(visibleStrings(section(markup, id)).join(" "), `#${id}`).toMatch(/Example/);
    }
  });

  it("shows no statistics, live chips or contact button on the sample profile", async () => {
    const markup = await render("/evidence");
    const text = visibleStrings(markup).join(" ");
    expect(text).not.toMatch(/\d+%|active|contact fundi|verified location/i);
    const profile = section(markup, "profile");
    expect(profile).not.toMatch(/<a\s|<button/);
    expect(visibleStrings(profile)).toContain(t("profile.showcase"));
    expect(visibleStrings(profile)).toContain(t("profile.private"));
  });
});

describe("/trades (#22)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Trades" });
  const names = createTranslator({ locale: defaultLocale, messages: en, namespace: "Landing.trades.names" });

  it("shows the two open trades with their task, an EXAMPLE rubric preview and 'Verify now' to Join", async () => {
    const open = section(await render("/trades"), "open");
    const strings = visibleStrings(open);
    for (const [i, key] of (["electrical", "hairdressing"] as const).entries()) {
      expect(strings).toContain(t("open.trade", { n: `0${i + 1}`, trade: names(key) }));
      expect(strings).toContain(t(`open.${key}.task`));
    }
    expect(strings.filter((s) => s === t("open.rubric"))).toHaveLength(2);
    const anchors = [...open.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(anchors.map((m) => m[1])).toEqual(["/sign-up", "/sign-up"]);
    for (const [, , inner] of anchors) expect(visibleStrings(inner)).toContain(t("open.verifyNow"));
  });

  it("never says LIVE, 'system active' or 'tamper-evident'", async () => {
    const text = visibleStrings(await render("/trades")).join(" ");
    expect(text).not.toMatch(/\blive\b|system active|tamper|master fundis/i);
  });

  it("shows ten bench trades as 'Coming soon' readouts, not links or buttons", async () => {
    const bench = section(await render("/trades"), "bench");
    expect(visibleStrings(bench).filter((s) => s === t("bench.comingSoon"))).toHaveLength(10);
    const tiles = bench.slice(0, bench.indexOf(t("bench.note")));
    expect(tiles).not.toMatch(/<a\s|<button|disabled|opacity-(50|60)/);
  });
});

describe("/telemetry (#23)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Telemetry" });

  it("has the prompt's sections in order: hero, pipeline, outputs, privacy, appeals", async () => {
    const markup = await render("/telemetry");
    const at = ["top", "pipeline", "outputs", "privacy", "appeals"].map((id) => markup.indexOf(`id="${id}"`));
    for (const p of at) expect(p).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("shows the six pipeline stages and the three AI outputs", async () => {
    const markup = await render("/telemetry");
    const pipeline = visibleStrings(section(markup, "pipeline"));
    for (const stage of ["ingest", "guard", "observe", "assess", "rules", "expert"] as const) {
      expect(pipeline).toContain(t(`pipeline.stages.${stage}.title`));
    }
    const outputs = visibleStrings(section(markup, "outputs"));
    for (const out of ["pass", "review", "reshoot"] as const) expect(outputs).toContain(t(`outputs.${out}.title`));
    expect(outputs).toContain(t("outputs.caption"));
  });

  it("marks deletion and appeals 'Coming soon' until V4 ships them (HANDOFF C-6)", async () => {
    const markup = await render("/telemetry");
    const privacy = section(markup, "privacy");
    const deleteRow = privacy.slice(privacy.indexOf(t("privacy.rows.delete.label")));
    expect(visibleStrings(deleteRow.slice(0, 600))).toContain(t("comingSoon"));
    expect(visibleStrings(section(markup, "appeals"))).toContain(t("comingSoon"));
  });

  it("invents no numbers or infrastructure claims", async () => {
    const text = visibleStrings(await render("/telemetry")).join(" ");
    expect(text).not.toMatch(/\d+%|enclave|cryptograph|tamper|hardware tethered|isolated gpu|irreversible|senior panel/i);
  });
});

describe("/about (#24)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "About" });

  it("has the prompt's sections: hero, what we are, principles, statement, links", async () => {
    const markup = await render("/about");
    const at = ["top", "what", "principles", "statement", "more"].map((id) => markup.indexOf(`id="${id}"`));
    for (const p of at) expect(p).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(visibleStrings(markup)).toContain(t("hero.title"));
  });

  it("says what we are not, and tags bookings and payments 'Coming soon'", async () => {
    const what = visibleStrings(section(await render("/about"), "what"));
    expect(what).toContain(t("what.not.title"));
    expect(what).toContain(t("what.notYet.title"));
    expect(what).toContain(t("comingSoon"));
  });

  it("lists the four principles and links on to telemetry, the roadmap and contact", async () => {
    const markup = await render("/about");
    const principles = visibleStrings(section(markup, "principles"));
    for (const n of ["1", "2", "3", "4"] as const) expect(principles).toContain(t(`principles.items.${n}.title`));
    const more = [...section(markup, "more").matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
    expect(more).toEqual(["/telemetry", "/#roadmap", "/contact"]);
  });

  it("drops the export's invented readouts", async () => {
    const text = visibleStrings(await render("/about")).join(" ");
    expect(text).not.toMatch(/fps|continuous telemetry|fresh telemetry|trade verified|verification seal|raw bench/i);
  });
});

describe("/contact (#24)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Contact" });

  it("has no live-looking form or placeholder address while no contact email is set", async () => {
    const { CONTACT_EMAIL } = await import("@/lib/contact");
    expect(CONTACT_EMAIL).toBeNull();
    const markup = await render("/contact");
    expect(markup).not.toMatch(/<form|<textarea|type="submit"|example\.com/);
    expect(visibleStrings(markup)).toContain(t("direct.pending"));
  });

  it("builds a mailto link with the role and message, to the one contact address", async () => {
    const { buildMailto } = await import("@/lib/contact");
    const href = buildMailto("team@smartfundis.example", { role: "Fundi", message: "Habari? Line 2 & more" });
    expect(href.startsWith("mailto:team@smartfundis.example?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toContain("Fundi");
    expect(params.get("body")).toBe("Habari? Line 2 & more");
  });
});

describe("/privacy (#25)", () => {
  const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Privacy" });

  it("keeps the Stitch layout: hero, who sees what, consent, your controls", async () => {
    const markup = await render("/privacy");
    const at = ["top", "who", "consent", "controls"].map((id) => markup.indexOf(`id="${id}"`));
    for (const p of at) expect(p).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(visibleStrings(markup)).toContain(t("hero.title"));
  });

  it("shows the access matrix as a table: only the badge and showcase links are public", async () => {
    const who = section(await render("/privacy"), "who");
    expect(who).toMatch(/<table/);
    const rows = [...who.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => visibleStrings(m[0]));
    const body = rows.slice(1);
    expect(body).toHaveLength(5);
    const publicRows = body.filter((cells) => cells.includes(t("who.yes"))).map((cells) => cells[0]);
    expect(publicRows).toEqual([t("who.rows.badge.item"), t("who.rows.showcase.item")]);
  });

  it("describes consent in English only: no Kiswahili consent text is printed", async () => {
    const markup = await render("/privacy");
    const text = visibleStrings(markup).join(" ");
    expect(text).not.toMatch(/ninakubali|video yangu|wataalamu|hadharani/i);
    expect(visibleStrings(section(markup, "consent"))).toContain(t("consent.languages"));
  });

  it("tags delete and visibility 'Coming soon'; training is policy, untagged", async () => {
    const controls = section(await render("/privacy"), "controls");
    const cards = [...controls.matchAll(/<li[\s\S]*?<\/li>/g)].map((m) => visibleStrings(m[0]));
    const byLabel = (key: string) => cards.find((c) => c.includes(t(`controls.${key}.label` as never)))!;
    expect(byLabel("delete")).toContain(t("comingSoon"));
    expect(byLabel("visibility")).toContain(t("comingSoon"));
    expect(byLabel("training")).not.toContain(t("comingSoon"));
  });

  it("drops the export's invented readouts", async () => {
    const text = visibleStrings(await render("/privacy")).join(" ");
    expect(text).not.toMatch(/cold storage|hardware|fps|standby|sovereignty|zero harvest|purge|spec \/\//i);
  });
});
