// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";

const links = createTranslator({ locale: defaultLocale, messages: en, namespace: "Links" });

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render() {
  const { CompanyMenu } = await import("@/components/company-menu");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <CompanyMenu variant="desktop" className="" />
      </NextIntlClientProvider>,
    );
  });
  const button = container.querySelector("button")!;
  const panel = document.getElementById(button.getAttribute("aria-controls")!)!;
  return { button, panel };
}

describe("COMPANY menu (#24)", () => {
  it("opens About and Contact us from a button with aria-expanded", async () => {
    const { button, panel } = await render();
    expect(button.textContent).toContain(links("company"));
    expect(panel.hidden).toBe(true);

    await act(async () => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect([...panel.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      [links("about"), "/about"],
      [links("contact"), "/contact"],
    ]);
  });

  it("closes on Escape and returns focus to the button", async () => {
    const { button, panel } = await render();
    await act(async () => button.click());
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("closes on a click outside", async () => {
    const { button, panel } = await render();
    await act(async () => button.click());
    await act(async () => {
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(panel.hidden).toBe(true);
  });

  it("closes when focus leaves the menu (#22)", async () => {
    const { button, panel } = await render();
    const outside = document.createElement("a");
    outside.href = "/";
    document.body.appendChild(outside);
    await act(async () => button.click());
    await act(async () => {
      button.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: outside }));
    });
    expect(panel.hidden).toBe(true);
  });

  it("stays open while focus moves inside it", async () => {
    const { button, panel } = await render();
    await act(async () => button.click());
    const inside = panel.querySelector("a")!;
    await act(async () => {
      button.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: inside }));
    });
    expect(panel.hidden).toBe(false);
  });
});
