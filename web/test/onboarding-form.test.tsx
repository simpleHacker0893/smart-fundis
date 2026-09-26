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
const tp = createTranslator({ locale: defaultLocale, messages: en, namespace: "TradePicker" });
const catalogue = en.TradeCatalogue;

const USER = { _id: "users_1", email: "a@example.com" };
const TRADES = [
  { slug: "electrical", name: "Electrical", category: "skilled", verifyNow: true },
  { slug: "hairdressing", name: "Hairdressing", category: "skilled", verifyNow: true },
  { slug: "plumbing", name: "Plumbing", category: "skilled", verifyNow: false },
  { slug: "mamaFua", name: "Mama fua (laundry)", category: "odd_job", verifyNow: false },
  { slug: "paving", name: "Cabro & paving", category: "semi_skilled", verifyNow: false },
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
  const el = container.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]:not([type="hidden"])`);
  if (!el) throw new Error(`no field ${name}`);
  return el;
}

function setValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

function checkbox(slug: string) {
  return container.querySelector<HTMLInputElement>(`input[type="checkbox"][value="${slug}"]`);
}

function pickTrade(slug: string) {
  const box = checkbox(slug);
  if (!box) throw new Error(`no trade ${slug} showing`);
  act(() => box.click());
}

function byLabel<T extends HTMLElement>(label: string): T {
  const el = [...container.querySelectorAll("label")].find((l) => l.textContent === label);
  const target = el && container.querySelector<T>(`#${CSS.escape(el.htmlFor)}`);
  if (!target) throw new Error(`no control labelled ${label}`);
  return target;
}

const typeSelect = () => byLabel<HTMLSelectElement>(tp("type"));
const searchBox = () => byLabel<HTMLInputElement>(tp("search"));

function chooseType(type: string) {
  act(() => setValue(typeSelect(), type));
}

function search(query: string) {
  act(() => setValue(searchBox(), query));
}

/** The names of the Trade rows showing, by each checkbox's accessible name. */
function shownTrades() {
  return [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].map(
    (box) => document.getElementById(box.getAttribute("aria-labelledby")!)?.textContent,
  );
}

function chips() {
  return [...container.querySelectorAll<HTMLButtonElement>("button[data-chip]")].map((b) => b.textContent);
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

  it("labels every field, and offers all 47 counties", async () => {
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

    const options = [...(input("county") as HTMLSelectElement).options];
    expect(options[0].value).toBe("");
    expect(options[0].textContent).toBe(t("countyPlaceholder"));
    expect(options.slice(1).map((o) => o.value)).toEqual([...KENYAN_COUNTIES]);
    expect(KENYAN_COUNTIES).toHaveLength(47);
  });

  it("falls back to the Trade's stored name when it has no translation key", async () => {
    state.trades = [...TRADES, { slug: "boat-building", name: "Boat building", category: "skilled", verifyNow: false }];
    await render();
    expect(shownTrades()).toContain("Boat building");
  });

  it("uses a phone keyboard and 48 px tap targets", async () => {
    await render();
    expect(input("phone").getAttribute("type")).toBe("tel");
    expect(input("phone").getAttribute("autocomplete")).toBe("tel");
    for (const el of [input("name"), input("phone"), input("county"), container.querySelector("button[type=submit]")!]) {
      expect(el.className, el.getAttribute("name") ?? "submit").toMatch(/\b(min-h-12|h-12)\b/);
    }
    for (const el of [typeSelect(), searchBox()]) expect(el.className).toMatch(/\bmin-h-12\b/);
    for (const box of container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
      expect(box.closest("label")?.className).toMatch(/\bmin-h-12\b/);
    }
    pickTrade("electrical");
    const chipButtons = container.querySelectorAll("button[data-chip]");
    expect(chipButtons).toHaveLength(1);
    for (const chip of chipButtons) expect(chip.className).toMatch(/\bmin-h-12\b/);
  });

  describe("the Trade picker (operator change 2: a type-of-work dropdown, not rows)", () => {
    it("offers the three types of work in a native select, never called a category", async () => {
      await render();
      const select = typeSelect();
      expect(select.tagName).toBe("SELECT");
      expect([...select.options].map((o) => [o.value, o.textContent])).toEqual([
        ["skilled", tp("types.skilled")],
        ["semi_skilled", tp("types.semi_skilled")],
        ["odd_job", tp("types.odd_job")],
      ]);
      expect(container.textContent).not.toMatch(/categor/i);
    });

    it("lists only the chosen type's Trades, each with its name and one-line description", async () => {
      await render();
      expect(shownTrades()).toEqual([catalogue.electrical.name, catalogue.hairdressing.name, catalogue.plumbing.name]);
      expect(container.textContent).toContain(catalogue.plumbing.description);
      chooseType("odd_job");
      expect(shownTrades()).toEqual([catalogue.mamaFua.name]);
      expect(container.textContent).toContain(catalogue.mamaFua.description);
      expect(container.textContent).not.toContain(catalogue.plumbing.description);
    });

    it("marks each Trade Verify now or Verification coming soon, never in amber (only a Badge uses amber)", async () => {
      await render();
      const status = (slug: string) => {
        const ids = checkbox(slug)!.getAttribute("aria-describedby")!.split(" ");
        return ids.map((i) => document.getElementById(i)!).find((el) => el.dataset.status)!;
      };
      expect(status("electrical").textContent).toBe(tp("verifyNow"));
      expect(status("electrical").className).toMatch(/\btext-foreground\b/);
      expect(status("electrical").className).not.toMatch(/primary|amber/);
      expect(status("electrical").textContent).not.toContain("✓");
      expect(status("plumbing").textContent).toBe(tp("verifyLater"));
      expect(status("plumbing").className).not.toMatch(/primary|amber/);
      expect(status("plumbing").textContent).not.toContain("✓");
    });

    it("notes when a Trade may need a licence", async () => {
      await render();
      expect(container.textContent).toContain(tp("licence", { regulator: "EPRA" }));
      expect(container.textContent).toContain(tp("licence", { regulator: "NCA" }));
    });

    it("searches every type of work by name, and says when nothing matches", async () => {
      await render();
      search("fua");
      expect(shownTrades()).toEqual([catalogue.mamaFua.name]);
      expect(container.textContent).toContain(tp("matches", { count: 1 }));
      search("PAVING");
      expect(shownTrades()).toEqual([catalogue.paving.name]);
      search("astronaut");
      expect(shownTrades()).toEqual([]);
      expect(container.textContent).toContain(tp("noMatches"));
    });

    it("clears the search when a type of work is chosen", async () => {
      await render();
      search("fua");
      chooseType("skilled");
      expect(searchBox().value).toBe("");
      expect(shownTrades()).toHaveLength(3);
    });

    it("does not submit the form when Enter is pressed in the search box", async () => {
      await render();
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      act(() => searchBox().dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
    });

    it("keeps selections across types of work and shows them as removable chips", async () => {
      await render();
      expect(container.textContent).toContain(tp("selected", { count: 0 }));
      pickTrade("plumbing");
      chooseType("odd_job");
      pickTrade("mamaFua");
      chooseType("skilled");
      expect(checkbox("plumbing")!.checked).toBe(true);
      expect(container.textContent).toContain(tp("selected", { count: 2 }));
      expect(chips()).toEqual([catalogue.plumbing.name, catalogue.mamaFua.name]);

      const remove = container.querySelector<HTMLButtonElement>(
        `button[data-chip][aria-label="${tp("remove", { trade: catalogue.plumbing.name })}"]`,
      )!;
      act(() => remove.click());
      expect(chips()).toEqual([catalogue.mamaFua.name]);
      expect(checkbox("plumbing")!.checked).toBe(false);
      expect(container.textContent).toContain(tp("selected", { count: 1 }));
    });

    it("sends every selected Trade, from every type of work, in catalogue order", async () => {
      await render();
      act(() => {
        setValue(input("name"), "Otieno");
        setValue(input("phone"), "0712 345 678");
        setValue(input("county"), "Kisumu");
      });
      chooseType("odd_job");
      pickTrade("mamaFua");
      chooseType("skilled");
      pickTrade("electrical");
      await submit();
      expect(state.create).toHaveBeenCalledWith({
        name: "Otieno",
        phone: "0712 345 678",
        tradeSlugs: ["electrical", "mamaFua"],
        county: "Kisumu",
      });
    });

    it("moves focus to the type-of-work dropdown when no Trade is chosen", async () => {
      await render();
      act(() => {
        setValue(input("name"), "Otieno");
        setValue(input("phone"), "0712 345 678");
      });
      await submit();
      expect(fieldError("tradeSlugs")).toBe(t("errors.tradeRequired"));
      expect(document.activeElement).toBe(typeSelect());
      // The error is announced once, through the fieldset, not again on the select.
      expect(typeSelect().getAttribute("aria-invalid")).toBe("true");
      expect(typeSelect().closest("fieldset")!.getAttribute("aria-describedby")).toContain("-tradeSlugs-error");
    });
  });

  it("shows inline errors from the shared rules and does not call the server", async () => {
    await render();
    await submit();
    expect(state.create).not.toHaveBeenCalled();
    expect(fieldError("name")).toBe(t("errors.nameRequired"));
    expect(fieldError("phone")).toBe(t("errors.phoneInvalid"));
    expect(fieldError("tradeSlugs")).toBe(t("errors.tradeRequired"));
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
      tradeSlugs: ["electrical"],
      county: "Nairobi",
    });
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("shows the server's field errors inline", async () => {
    state.create.mockRejectedValueOnce(new ConvexError({ code: "invalid", fields: { tradeSlugs: "unknown" } }));
    await render();
    fillValid();
    await submit();
    expect(fieldError("tradeSlugs")).toBe(t("errors.tradeRequired"));
    // A Trade is selected, so hidden inputs come first in the DOM: focus still lands on the dropdown.
    expect(document.activeElement).toBe(typeSelect());
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
