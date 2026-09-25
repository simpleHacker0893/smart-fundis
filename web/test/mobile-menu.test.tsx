// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { leafStrings } from "./copy-helpers";

const REAL_ROUTES = ["/", "/sign-in", "/sign-up", "/dashboard"];

const clerk = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }));
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: clerk.isLoaded, isSignedIn: clerk.isSignedIn }),
}));

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Shell" });
const linkText = createTranslator({ locale: defaultLocale, messages: en, namespace: "Links" });
const messageValues = new Set(leafStrings(en));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  clerk.isSignedIn = false;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function renderMenu() {
  const { MobileMenu } = await import("@/components/mobile-menu");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <MobileMenu />
      </NextIntlClientProvider>,
    );
  });
  const trigger = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${t("openMenu")}"]`,
  );
  expect(trigger).not.toBeNull();
  return trigger!;
}

async function open(trigger: HTMLButtonElement) {
  await act(async () => {
    trigger.click();
  });
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  expect(dialog, "the menu did not open").not.toBeNull();
  return dialog!;
}

describe("mobile menu", () => {
  it("opens a labelled dialog and flips aria-expanded", async () => {
    const trigger = await renderMenu();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    const dialog = await open(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)?.textContent).toBe(t("menuTitle"));
  });

  it("offers Sign in and Join as a fundi when signed out, linking only to real pages", async () => {
    const dialog = await open(await renderMenu());
    const links = [...dialog.querySelectorAll("a")];

    expect(links.map((a) => a.textContent)).toEqual([linkText("signIn"), linkText("joinAsFundi")]);
    for (const a of links) expect(REAL_ROUTES).toContain(a.getAttribute("href"));
  });

  it("offers the dashboard when signed in", async () => {
    clerk.isSignedIn = true;
    const dialog = await open(await renderMenu());
    const links = [...dialog.querySelectorAll("a")];

    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      [linkText("dashboard"), "/dashboard"],
    ]);
  });

  it("shows only strings from messages/en.json, including the close button's name", async () => {
    const dialog = await open(await renderMenu());
    const texts = [...dialog.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && el.textContent?.trim())
      .map((el) => el.textContent!.trim());
    const labels = [...dialog.querySelectorAll("[aria-label]")].map((el) =>
      el.getAttribute("aria-label")!,
    );

    expect(texts.length).toBeGreaterThan(0);
    for (const s of [...texts, ...labels]) {
      expect(messageValues, `hardcoded string in the menu: "${s}"`).toContain(s);
    }
  });

  it("closes on Escape and returns focus to the menu button", async () => {
    const trigger = await renderMenu();
    trigger.focus();
    const dialog = await open(trigger);

    await act(async () => {
      dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    // Base UI keeps the popup mounted until its exit finishes; give it a tick.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
