// @vitest-environment jsdom
import { ConvexError } from "convex/values";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KENYAN_COUNTIES } from "@convex/lib/counties";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Onboarding" });
const tradeName = createTranslator({ locale: defaultLocale, messages: en, namespace: "Landing.trades.names" });

const USER = { _id: "users_1", email: "a@example.com" };
const TRADES = [
  { slug: "electrical", name: "Electrical", verifyNow: true },
  { slug: "hairdressing", name: "Hairdressing", verifyNow: true },
];

const state = vi.hoisted(() => ({
  isAuthenticated: true,
  me: undefined as unknown,
  trades: undefined as unknown,
  create: vi.fn<(args: object) => Promise<string>>(),
  replace: vi.fn(),
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    useConvexAuth: () => ({ isLoading: !state.isAuthenticated, isAuthenticated: state.isAuthenticated }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      if (args === "skip") return undefined;
      return getFunctionName(ref) === "trades:list" ? state.trades : state.me;
    },
    useMutation: () => state.create,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.isAuthenticated = true;
  state.me = { user: USER, roles: { base: "none", expert: false, admin: false } };
  state.trades = TRADES;
  state.create.mockReset();
  state.create.mockResolvedValue("fundiProfiles_1");
  state.replace.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render({ convexAvailable = true } = {}) {
  const { OnboardingForm } = await import("@/app/(site)/onboarding/onboarding-form");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ConvexAvailableContext value={convexAvailable}>
          <OnboardingForm />
        </ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

function input(name: string) {
  const el = container.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]:not([type="radio"])`);
  if (!el) throw new Error(`no field ${name}`);
  return el;
}

function setValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

function pickTrade(slug: string) {
  const radio = container.querySelector<HTMLInputElement>(`input[type="radio"][value="${slug}"]`);
  if (!radio) throw new Error(`no trade ${slug}`);
  act(() => radio.click());
}

function fillValid() {
  act(() => {
    setValue(input("name"), "  Wanjiru Kamau ");
    setValue(input("phone"), "0712 345 678");
    setValue(input("county"), "Nairobi");
  });
  pickTrade("electrical");
}

async function submit() {
  const form = container.querySelector("form")!;
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function fieldError(field: string) {
  return container.querySelector(`[id$="-${field}-error"]`)?.textContent ?? null;
}

describe("OnboardingForm (#37, minimal Fundi profile)", () => {
  it("shows a loading status until users.me and trades.list load", async () => {
    state.me = undefined;
    await render();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(t("loading"));
    expect(container.querySelector("form")).toBeNull();
  });

  it("keeps loading, with no form, when users.me returns null (signed out)", async () => {
    state.me = null;
    await render();
    expect(container.querySelector('[role="status"]')?.textContent).toBe(t("loading"));
    expect(container.querySelector("form")).toBeNull();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("sends a User who already has a Fundi profile to /dashboard", async () => {
    state.me = { user: USER, roles: { base: "fundi", expert: false, admin: false } };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(container.querySelector("form")).toBeNull();
  });

  it("labels every field, and offers each Trade by its translated name and all 47 counties", async () => {
    await render();
    for (const [name, label] of [
      ["name", t("name")],
      ["phone", t("phone")],
      ["county", t("county")],
    ] as const) {
      const el = input(name);
      expect(container.querySelector(`label[for="${el.id}"]`)?.textContent).toBe(label);
    }
    expect(container.querySelector("fieldset legend")?.textContent).toBe(t("trade"));
    const tradeLabels = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"][name="tradeSlug"]')].map(
      (r) => container.querySelector(`label[for="${r.id}"]`)?.textContent,
    );
    expect(tradeLabels).toEqual([tradeName("electrical"), tradeName("hairdressing")]);

    const options = [...(input("county") as HTMLSelectElement).options];
    expect(options[0].value).toBe("");
    expect(options[0].textContent).toBe(t("countyPlaceholder"));
    expect(options.slice(1).map((o) => o.value)).toEqual([...KENYAN_COUNTIES]);
    expect(KENYAN_COUNTIES).toHaveLength(47);
  });

  it("falls back to the Trade's stored name when it has no translation key", async () => {
    state.trades = [...TRADES, { slug: "boat-building", name: "Boat building", verifyNow: false }];
    await render();
    expect(container.textContent).toContain("Boat building");
  });

  it("uses a phone keyboard and 48 px tap targets", async () => {
    await render();
    expect(input("phone").getAttribute("type")).toBe("tel");
    expect(input("phone").getAttribute("autocomplete")).toBe("tel");
    for (const el of [input("name"), input("phone"), input("county"), container.querySelector("button[type=submit]")!]) {
      expect(el.className, el.getAttribute("name") ?? "submit").toMatch(/\b(min-h-12|h-12)\b/);
    }
    for (const r of container.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
      expect(container.querySelector(`label[for="${r.id}"]`)?.className).toMatch(/\bmin-h-12\b/);
    }
  });

  it("shows inline errors from the shared rules and does not call the server", async () => {
    await render();
    await submit();
    expect(state.create).not.toHaveBeenCalled();
    expect(fieldError("name")).toBe(t("errors.nameRequired"));
    expect(fieldError("phone")).toBe(t("errors.phoneInvalid"));
    expect(fieldError("tradeSlug")).toBe(t("errors.tradeRequired"));
    expect(fieldError("county")).toBe(t("errors.countyRequired"));
    expect(input("name").getAttribute("aria-invalid")).toBe("true");
    expect(input("name").getAttribute("aria-describedby")).toContain("-name-error");
    expect(document.activeElement).toBe(input("name"));
  });

  it("creates the profile with the typed values, then goes to /dashboard", async () => {
    await render();
    fillValid();
    await submit();
    expect(state.create).toHaveBeenCalledWith({
      name: "  Wanjiru Kamau ",
      phone: "0712 345 678",
      tradeSlug: "electrical",
      county: "Nairobi",
    });
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("shows the server's field errors inline", async () => {
    state.create.mockRejectedValueOnce(new ConvexError({ code: "invalid", fields: { tradeSlug: "unknown" } }));
    await render();
    fillValid();
    await submit();
    expect(fieldError("tradeSlug")).toBe(t("errors.tradeRequired"));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("goes to /dashboard when the profile already exists", async () => {
    state.create.mockRejectedValueOnce(new ConvexError({ code: "already_exists", message: "x" }));
    await render();
    fillValid();
    await submit();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("asks the User to retry while their account is being set up (no_user)", async () => {
    state.create.mockRejectedValueOnce(new ConvexError({ code: "no_user" }));
    await render();
    fillValid();
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(t("errors.noUser"));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("shows the generic failure for anything else, and lets the User try again", async () => {
    state.create.mockRejectedValueOnce(new Error("network"));
    await render();
    fillValid();
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(t("errors.failed"));
    expect(container.querySelector<HTMLButtonElement>("button[type=submit]")!.disabled).toBe(false);
  });

  it("says so when no Trades are open", async () => {
    state.trades = [];
    await render();
    expect(container.textContent).toContain(t("noTrades"));
    expect(container.querySelector("form")).toBeNull();
  });

  it("says the form is unavailable without Convex", async () => {
    await render({ convexAvailable: false });
    expect(container.textContent).toBe(t("unavailable"));
  });

  it("renders only copy from en.json (county names are data)", async () => {
    await render();
    await submit();
    const isCopy = makeIsFromMessages(en);
    const counties = new Set<string>(KENYAN_COUNTIES);
    const texts = [...container.querySelectorAll("label, legend, p, option, button, h1, h2, span")]
      .filter((el) => el.children.length === 0)
      .map((el) => el.textContent!.trim())
      .filter(Boolean);
    expect(texts.length).toBeGreaterThan(0);
    for (const s of texts) expect(isCopy(s) || counties.has(s), `hardcoded string: "${s}"`).toBe(true);
  });
});
