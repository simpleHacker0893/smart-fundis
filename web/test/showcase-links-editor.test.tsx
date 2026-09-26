// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Showcase" });
const SAMPLE_ELECTRICAL = "https://www.youtube.com/watch?v=2tdN85reWN0";
const SAMPLE_HAIRDRESSING = "https://www.youtube.com/watch?v=qSHhSnuUcXc";

let container: HTMLDivElement;
let root: Root;
let onSave: ReturnType<typeof vi.fn<(urls: string[]) => Promise<void>>>;

beforeEach(() => {
  onSave = vi.fn(async () => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render(urls: string[] = []) {
  const { ShowcaseLinksEditor } = await import("@/components/showcase-links-editor");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ShowcaseLinksEditor urls={urls} onSave={onSave} />
      </NextIntlClientProvider>,
    );
  });
}

function field(): HTMLInputElement {
  const label = [...container.querySelectorAll("label")].find((l) => l.textContent === t("linkLabel"));
  return container.querySelector<HTMLInputElement>(`#${CSS.escape(label!.htmlFor)}`)!;
}
async function type(value: string) {
  const input = field();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
}
async function add() {
  const btn = [...container.querySelectorAll("button")].find((b) => b.textContent === t("add"))!;
  await act(async () => btn.click());
}

describe("ShowcaseLinksEditor (US-3.8)", () => {
  it("shows saved links as labelled embeds", async () => {
    await render([SAMPLE_ELECTRICAL, SAMPLE_HAIRDRESSING]);
    const srcs = [...container.querySelectorAll("iframe")].map((f) => f.getAttribute("src"));
    expect(srcs).toEqual([
      "https://www.youtube-nocookie.com/embed/2tdN85reWN0",
      "https://www.youtube-nocookie.com/embed/qSHhSnuUcXc",
    ]);
    expect(container.textContent?.split(t("label")).length).toBe(3);
  });

  it("adds a pasted sample YouTube link and saves the whole list", async () => {
    await render([SAMPLE_ELECTRICAL]);
    await type(` ${SAMPLE_HAIRDRESSING} `);
    await add();
    expect(onSave).toHaveBeenCalledWith([SAMPLE_ELECTRICAL, SAMPLE_HAIRDRESSING]);
    expect(field().value).toBe("");
  });

  it("explains a link it cannot use, once, and saves nothing", async () => {
    await render();
    await type("https://vimeo.com/1");
    await add();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(t("errors.unsupported"));
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not add the same video twice", async () => {
    await render([SAMPLE_ELECTRICAL]);
    await type("https://youtu.be/2tdN85reWN0");
    await add();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(t("errors.duplicate"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("removes a link", async () => {
    await render([SAMPLE_ELECTRICAL, SAMPLE_HAIRDRESSING]);
    const remove = [...container.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === t("remove", { n: 1 }))!;
    await act(async () => remove.click());
    expect(onSave).toHaveBeenCalledWith([SAMPLE_HAIRDRESSING]);
  });

  it("says so when saving fails", async () => {
    onSave.mockRejectedValueOnce(new Error("offline"));
    await render();
    await type(SAMPLE_ELECTRICAL);
    await add();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(t("errors.save"));
  });

  it("uses only en.json copy and 48 px controls", async () => {
    await render([SAMPLE_ELECTRICAL]);
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    for (const s of texts) expect(isCopy(s), s).toBe(true);
    for (const b of container.querySelectorAll("button")) expect(b.className).toMatch(/\bh-12\b|\bmin-h-12\b/);
    expect(field().className).toMatch(/\bmin-h-12\b/);
  });
});
