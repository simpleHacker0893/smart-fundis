// @vitest-environment jsdom
import { ConvexError } from "convex/values";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseShowcaseLink } from "@convex/lib/showcaseLinks";
import type { SavedShowcaseLinks, ShowcaseLinksUpdate } from "@/components/showcase-links-editor";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Showcase" });
// The operator's sample links (2026-09-26).
const SAMPLE_ELECTRICAL = "https://www.youtube.com/watch?v=2tdN85reWN0";
const SAMPLE_HAIRDRESSING = "https://www.youtube.com/watch?v=qSHhSnuUcXc";
const TIKTOK = "https://www.tiktok.com/@fundi.wanjiru/video/7212345678901234567";

/** What fundiProfiles.myShowcaseLinks returns for a stored link. */
function saved(url: string) {
  const parsed = parseShowcaseLink(url);
  if (!parsed.ok) throw new Error(url);
  const { id, url: canonical, embedUrl } = parsed.link;
  return { id, url: canonical, embedUrl };
}

let container: HTMLDivElement;
let root: Root;
let onSave: ReturnType<typeof vi.fn<(update: ShowcaseLinksUpdate) => Promise<unknown>>>;

beforeEach(() => {
  onSave = vi.fn(async () => null);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render(links: SavedShowcaseLinks | "loading" = { youtube: null, tiktok: null }) {
  const { ShowcaseLinksEditor } = await import("@/components/showcase-links-editor");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ShowcaseLinksEditor links={links === "loading" ? undefined : links} onSave={onSave} />
      </NextIntlClientProvider>,
    );
  });
}

function field(label: string): HTMLInputElement {
  const el = [...container.querySelectorAll("label")].find((l) => l.textContent === label);
  if (!el) throw new Error(`no label "${label}"`);
  return container.querySelector<HTMLInputElement>(`#${CSS.escape(el.htmlFor)}`)!;
}
async function type(label: string, value: string) {
  const input = field(label);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
}
function button(name: string): HTMLButtonElement {
  const found = [...container.querySelectorAll("button")].find((b) => b.textContent === name);
  if (!found) throw new Error(`no button "${name}"`);
  return found;
}
async function tap(name: string) {
  await act(async () => button(name).click());
}
const alerts = () => [...container.querySelectorAll('[role="alert"]')].map((a) => a.textContent);
const YT = () => t("slots.youtube.label");
const TT = () => t("slots.tiktok.label");

describe("ShowcaseLinksEditor (US-3.8, ADR-7)", () => {
  it("is a separate section that says these links never earn a Badge", async () => {
    await render();
    expect(container.querySelector("h2")?.textContent).toBe(t("title"));
    expect(t("title")).toBe("Show your past work");
    expect(t("intro")).toMatch(/never earn a Badge/);
    expect(t("intro")).toMatch(/only a video recorded here can be verified/i);
    expect(container.textContent).toContain(t("intro"));
    expect(container.textContent).not.toMatch(/certif/i);
  });

  it("says it is loading until the saved links arrive", async () => {
    await render("loading");
    expect(container.textContent).toContain(t("loading"));
    expect(container.querySelector("input")).toBeNull();
  });

  it("has one YouTube field and one TikTok field, each with its own Save", async () => {
    await render();
    expect(field(YT()).type).toBe("url");
    expect(field(TT()).type).toBe("url");
    expect(button(t("slots.youtube.save"))).toBeTruthy();
    expect(button(t("slots.tiktok.save"))).toBeTruthy();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("shows each saved link as an embed labelled 'Showcase — not verified', with its note and a Remove", async () => {
    await render({ youtube: saved(SAMPLE_ELECTRICAL), tiktok: saved(TIKTOK) });
    const srcs = [...container.querySelectorAll("iframe")].map((f) => f.getAttribute("src"));
    expect(srcs).toEqual([
      "https://www.youtube-nocookie.com/embed/2tdN85reWN0",
      "https://www.tiktok.com/player/v1/7212345678901234567",
    ]);
    expect(container.textContent?.split(t("label")).length).toBe(3);
    expect(container.textContent?.split(t("note")).length).toBe(3);
    expect(button(t("slots.youtube.remove"))).toBeTruthy();
    expect(button(t("slots.tiktok.remove"))).toBeTruthy();
  });

  it("saves the operator's sample YouTube link as the canonical link, in the YouTube slot only", async () => {
    await render({ youtube: saved(SAMPLE_ELECTRICAL), tiktok: null });
    await type(YT(), ` youtu.be/qSHhSnuUcXc `);
    await tap(t("slots.youtube.save"));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ youtube: SAMPLE_HAIRDRESSING });
    expect(field(YT()).value).toBe("");
    expect(container.querySelector('[role="status"]')?.textContent).toBe(t("slots.youtube.saved"));
    expect(alerts()).toEqual([]);
  });

  it("checks the link before saving: blank, another site, or a link of the other slot", async () => {
    await render();
    await tap(t("slots.youtube.save"));
    expect(alerts()).toEqual([t("errors.youtube.empty")]);
    expect(field(YT()).getAttribute("aria-invalid")).toBe("true");

    await type(YT(), "https://vimeo.com/1");
    await tap(t("slots.youtube.save"));
    expect(alerts()).toEqual([t("errors.youtube.unsupported")]);

    await type(YT(), TIKTOK);
    await tap(t("slots.youtube.save"));
    expect(alerts()).toEqual([t("errors.youtube.wrong_site")]);

    await type(YT(), "https://vm.tiktok.com/ZMabc123/");
    await tap(t("slots.youtube.save"));
    expect(alerts()).toEqual([t("errors.youtube.wrong_site")]);

    await type(TT(), SAMPLE_ELECTRICAL);
    await tap(t("slots.tiktok.save"));
    expect(alerts()).toContain(t("errors.tiktok.wrong_site"));

    await type(TT(), "https://vm.tiktok.com/ZMabc123/");
    await tap(t("slots.tiktok.save"));
    expect(alerts()).toContain(t("errors.tiktok.tiktok_short"));
    expect(field(TT()).getAttribute("aria-describedby")).toContain(container.querySelectorAll('[role="alert"]')[1].id);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the server's field error for the slot, and keeps what was typed", async () => {
    onSave.mockRejectedValueOnce(new ConvexError({ code: "invalid", fields: { tiktok: "unsupported" } }));
    await render();
    await type(TT(), TIKTOK);
    await tap(t("slots.tiktok.save"));
    expect(onSave).toHaveBeenCalledWith({ tiktok: TIKTOK });
    expect(alerts()).toEqual([t("errors.tiktok.unsupported")]);
    expect(field(TT()).value).toBe(TIKTOK);
  });

  it("says so when saving fails for any other reason", async () => {
    onSave.mockRejectedValueOnce(new Error("offline"));
    await render();
    await type(YT(), SAMPLE_ELECTRICAL);
    await tap(t("slots.youtube.save"));
    expect(alerts()).toEqual([t("errors.save")]);
  });

  it("removes one slot by clearing it on the server", async () => {
    await render({ youtube: saved(SAMPLE_ELECTRICAL), tiktok: saved(TIKTOK) });
    await tap(t("slots.tiktok.remove"));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ tiktok: null });
  });

  it("uses only en.json copy and 48 px controls", async () => {
    await render({ youtube: saved(SAMPLE_ELECTRICAL), tiktok: null });
    await tap(t("slots.tiktok.save"));
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    for (const s of texts) expect(isCopy(s), s).toBe(true);
    for (const b of container.querySelectorAll("button")) expect(b.className).toMatch(/\bh-12\b|\bmin-h-12\b/);
    for (const i of container.querySelectorAll("input")) expect(i.className).toMatch(/\bmin-h-12\b/);
  });
});
