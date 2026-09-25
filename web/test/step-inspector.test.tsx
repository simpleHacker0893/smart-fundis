// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Landing" });

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
  const { StepProvider, StepInspector, Ledger } = await import("@/components/landing/step-inspector");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <StepProvider>
          <StepInspector imageSrc="/images/landing-socket-wiring.jpg" />
          <Ledger />
        </StepProvider>
      </NextIntlClientProvider>,
    );
  });
  const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  expect(tabs).toHaveLength(4);
  return tabs;
}

const selected = (tabs: HTMLElement[]) => tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
const ledgerCurrent = () =>
  [...container.querySelectorAll('[aria-current="step"]')].map((row) => row.textContent);

describe("hero step inspector", () => {
  it("opens on step 03, the step that needs review, as in the Stitch screen", async () => {
    const tabs = await render();
    expect(selected(tabs)).toBe(2);
    expect(container.textContent).toContain(t("inspector.counter", { step: "03" }));
    expect(container.textContent).toContain(t("steps.3.readout"));
    expect(ledgerCurrent()).toHaveLength(1);
    expect(ledgerCurrent()[0]).toContain(t("steps.3.name"));
  });

  it("switches the frame, the caption and the ledger row when a step is chosen", async () => {
    const tabs = await render();
    await act(async () => tabs[0].click());

    expect(selected(tabs)).toBe(0);
    expect(container.textContent).toContain(t("inspector.counter", { step: "01" }));
    expect(container.textContent).toContain(t("inspector.caption", { step: "01" }));
    expect(container.textContent).toContain(t("steps.1.readout"));
    expect(ledgerCurrent()[0]).toContain(t("steps.1.name"));
  });

  it("is a labelled tablist driving a tabpanel, with arrow-key movement", async () => {
    const tabs = await render();
    const list = container.querySelector('[role="tablist"]')!;
    expect(list.getAttribute("aria-label")).toBe(t("inspector.stepsLabel"));
    const panel = container.querySelector('[role="tabpanel"]')!;
    expect(panel.getAttribute("aria-labelledby")).toBe(tabs[2].id);

    tabs[2].focus();
    await act(async () => {
      tabs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(selected(tabs)).toBe(3);
    expect(document.activeElement).toBe(tabs[3]);
    // Only the selected tab is in the tab order.
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, -1, -1, 0]);
  });

  it("never shows a status by colour alone: every step carries its glyph and word", async () => {
    const tabs = await render();
    for (const [i, tab] of tabs.entries()) {
      const status = i === 2 ? t("status.review") : t("status.observed");
      expect(tab.textContent).toContain(status);
    }
  });
});
