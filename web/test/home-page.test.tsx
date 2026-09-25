import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { leafStrings, makeIsFromMessages, visibleStrings } from "./copy-helpers";

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

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Landing" });
const isFromMessages = makeIsFromMessages(en);

async function renderHome() {
  const { default: HomePage } = await import("@/app/page");
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {await HomePage()}
    </NextIntlClientProvider>,
  );
}

/** The markup of the <section id="..."> element. */
function section(markup: string, id: string): string {
  const start = markup.indexOf(`id="${id}"`);
  expect(start, `no section #${id}`).toBeGreaterThan(-1);
  const end = markup.indexOf("</section>", start);
  return markup.slice(start, end);
}

describe("landing page (Stitch v3)", () => {
  it("renders only strings that come from messages/en.json", async () => {
    const strings = visibleStrings(await renderHome());
    expect(strings.length).toBeGreaterThan(40);
    for (const s of strings) {
      expect(isFromMessages(s), `hardcoded string on the landing page: "${s}"`).toBe(true);
    }
  });

  it("has the nine sections in order, each with an anchor", async () => {
    const markup = await renderHome();
    const ids = ["evidence", "record", "telemetry", "decide", "badge", "trades", "scope", "roadmap", "join"];
    const positions = ids.map((id) => markup.indexOf(`id="${id}"`));
    for (const [i, p] of positions.entries()) expect(p, ids[i]).toBeGreaterThan(-1);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("uses the prompt's headlines", async () => {
    const strings = visibleStrings(await renderHome());
    for (const key of [
      "hero.titleLine1",
      "hero.titleLine2",
      "record.title",
      "check.title",
      "decide.title",
      "badge.title",
      "trades.titleLine1",
      "scope.title",
      "next.title",
    ] as const) {
      expect(strings).toContain(t(key));
    }
  });

  it("has exactly one h1", async () => {
    expect((await renderHome()).match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("marks every sample as EXAMPLE (hero frame, liveness code, ledger, badge)", async () => {
    const markup = await renderHome();
    for (const id of ["evidence", "record", "decide", "badge"]) {
      expect(visibleStrings(section(markup, id)), `#${id}`).toContain(t("inspector.example"));
    }
  });

  it("offers 'Verify now' on the two open trades, linking to Join; never says LIVE (#20)", async () => {
    const trades = section(await renderHome(), "trades");
    const anchors = [...trades.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(anchors.map((m) => m[1])).toEqual(["/sign-up", "/sign-up"]);
    for (const [, , inner] of anchors) expect(visibleStrings(inner)).toContain(t("trades.verifyNow"));
    expect(visibleStrings(trades).join(" ")).not.toMatch(/\blive\b/i);
  });

  it("shows the ten other trades as muted 'Coming soon' tiles, not buttons or links", async () => {
    const trades = section(await renderHome(), "trades");
    expect(visibleStrings(trades).filter((s) => s === t("trades.comingSoon"))).toHaveLength(10);
    expect(trades).not.toMatch(/<button|role="button"|disabled|opacity-(50|60)/);
  });

  it("shows coming-next items as readouts with no links (no roadmap page yet)", async () => {
    const next = section(await renderHome(), "roadmap");
    expect(next).not.toMatch(/<a\s/);
    expect(visibleStrings(next).filter((s) => s === t("next.comingSoon"))).toHaveLength(4);
  });

  it("loads only local images, with alt text from en.json", async () => {
    const markup = await renderHome();
    const imgs = [...markup.matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);
    expect(imgs.length).toBe(2);
    for (const img of imgs) {
      expect(img).not.toMatch(/googleusercontent/);
      expect(img).toMatch(/src="[^"]*images%2Flanding-[a-z-]+-\d+\.webp|src="\/images\/landing-[a-z-]+-\d+\.webp/);
    }
    expect(markup).toContain(`alt="${t("hero.imageAlt")}"`);
  });

  it("takes the page title and description from messages/en.json", async () => {
    const { generateMetadata } = await import("@/app/layout");
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(en.Metadata.title);
    expect(metadata.description).toBe(en.Metadata.description);
  });
});

describe("landing section 09 (#27)", () => {
  it("carries the 'Show your work.' band that left the footer, with Join and Find a fundi", async () => {
    const join = section(await renderHome(), "join");
    expect(visibleStrings(join)).toContain(t("seal.title"));
    const hrefs = [...join.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(["/join?role=fundi", "/#trades"]);
  });
});

describe("public images (HANDOFF §4)", () => {
  it("are all WebP and under 100 KB", () => {
    const dir = fileURLToPath(new URL("../public/images", import.meta.url));
    const files = readdirSync(dir);
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      expect(name, name).toMatch(/\.webp$/);
      expect(statSync(`${dir}/${name}`).size, name).toBeLessThan(100_000);
    }
  });
});

describe("messages", () => {
  it("never says certified (we verify; NITA, KNQA and TVETs certify)", () => {
    // HANDOFF §5: the only allowed use of the word is "NITA, KNQA and TVETs certify".
    const allowed = "NITA, KNQA and TVETs certify";
    for (const s of leafStrings(en)) {
      expect(s.replaceAll(allowed, "")).not.toMatch(/certif/i);
    }
  });

  it("never claims encryption, statistics or live status that isn't real", () => {
    for (const s of leafStrings(en)) {
      expect(s).not.toMatch(/encrypt|cryptograph|zero latency|100%|\d+(\.\d+)?%|live inspect|jury/i);
    }
  });

  it("ships English only: no sw.json yet", () => {
    const sw = fileURLToPath(new URL("../messages/sw.json", import.meta.url));
    expect(existsSync(sw)).toBe(false);
  });
});
