// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { leafStrings } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "FundiPage" });

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const state = vi.hoisted(() => ({
  protect: vi.fn(async () => ({ userId: "user_123" })),
  isAuthenticated: true,
  me: undefined as unknown,
  mine: undefined as unknown,
  queryArgs: [] as unknown[],
  calls: [] as { name: string; args: unknown }[],
  replace: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(vi.fn(), { protect: state.protect }) }));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  // Queries the page reads besides users.me return an empty, loaded result;
  // the upload flow and the Assessment list have their own tests.
  const others: Record<string, unknown> = {
    "trades:uploadPicker": [],
    "assessments:listMine": [],
    "assessments:currentLivenessCode": null,
  };
  return {
    useConvexAuth: () => ({ isLoading: !state.isAuthenticated, isAuthenticated: state.isAuthenticated }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      state.calls.push({ name, args });
      if (name === "users:me") state.queryArgs.push(args);
      if (args === "skip") return undefined;
      if (name === "users:me") return state.me;
      if (name === "fundiProfiles:mine") return state.mine;
      return others[name];
    },
    useMutation: () => vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

const USER = { _id: "users_1", email: "w@example.com", name: "Wanjiru Kamau", phone: "+254712345678", county: "Kiambu" };
const MINE = {
  name: USER.name,
  county: USER.county,
  trades: [
    { slug: "electrical", name: "Electrical", verifyNow: true },
    { slug: "mamaFua", name: "Mama fua (laundry)", verifyNow: false },
  ],
};
const roles = (r: object = {}) => ({ base: "none", expert: false, admin: false, ...r });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.protect.mockClear();
  state.isAuthenticated = true;
  state.me = undefined;
  state.mine = MINE;
  state.queryArgs = [];
  state.calls = [];
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
  const { default: FundiPage } = await import("@/app/(site)/fundi/page");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  const page = await FundiPage();
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ConvexAvailableContext value={convexAvailable}>{page}</ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

const heading = () => container.querySelector("h1")?.textContent ?? null;
const status = () => container.querySelector('[role="status"]');

describe("/fundi page (spec §4 page guard)", () => {
  it("protects itself on the server, not only in the proxy", async () => {
    await render();
    expect(state.protect).toHaveBeenCalledTimes(1);
  });

  it("has a page title from messages", async () => {
    const { generateMetadata } = await import("@/app/(site)/fundi/page");
    expect((await generateMetadata()).title).toBe(t("meta.title"));
  });

  it("shows a skeleton and does not route while users.me is loading", async () => {
    await render();
    expect(status()?.textContent).toBe(t("loading"));
    expect(status()?.getAttribute("aria-busy")).toBe("true");
    expect(heading()).toBeNull();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("skips users.me until Convex auth is ready", async () => {
    state.isAuthenticated = false;
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    expect(state.queryArgs.every((a) => a === "skip")).toBe(true);
    expect(status()?.textContent).toBe(t("loading"));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("keeps the skeleton when users.me returns null (signed out)", async () => {
    state.me = null;
    await render();
    expect(status()?.textContent).toBe(t("loading"));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("sends a User with no Fundi profile back to /dashboard, without showing the page", async () => {
    state.me = { user: USER, roles: roles() };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(heading()).toBeNull();
    expect(container.textContent).not.toContain(USER.name);
  });

  it("sends an Expert who is not a Fundi back to /dashboard", async () => {
    state.me = { user: USER, roles: roles({ expert: true }) };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("shows a Fundi the heading, their name and county", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    expect(state.replace).not.toHaveBeenCalled();
    expect(heading()).toBe(t("title"));
    expect(status()).toBeNull();
    const text = container.textContent ?? "";
    expect(text).toContain(t("name"));
    expect(text).toContain(USER.name);
    expect(text).toContain(t("county"));
    expect(text).toContain(USER.county);
    // Contact details are not shown back on this page.
    expect(text).not.toContain(USER.phone);
  });

  it("leaves out a county the row does not have", async () => {
    state.me = { user: { ...USER, county: undefined }, roles: roles({ base: "fundi" }) };
    await render();
    expect(heading()).toBe(t("title"));
    expect(container.textContent).not.toContain(t("county"));
  });

  it("lists the profile's Trades, saying which can be verified now (fundiProfiles.mine)", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    const items = [...container.querySelectorAll('[data-testid="profile-trade"]')].map((li) => li.textContent);
    expect(items).toEqual([
      `${en.TradeCatalogue.electrical.name}${t("tradeVerifyNow")}`,
      `${en.TradeCatalogue.mamaFua.name}${t("tradeVerifyLater")}`,
    ]);
    expect(container.textContent).toContain(t("trades"));
  });

  it("shows a Fundi their Assessments and the upload flow, and reads neither for anyone else", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    const h2s = [...container.querySelectorAll("h2")].map((h) => h.textContent);
    expect(h2s).toContain(en.AssessmentList.title);
    expect(h2s).toContain(en.UploadFlow.title);

    act(() => root.unmount());
    root = createRoot(container);
    state.calls = [];
    state.me = { user: USER, roles: roles() };
    await render();
    const fundiOnly = ["assessments:listMine", "trades:uploadPicker", "assessments:currentLivenessCode"];
    expect(state.calls.filter((c) => fundiOnly.includes(c.name) && c.args !== "skip")).toEqual([]);
  });

  it("does not read fundiProfiles.mine until the caller is known to be a Fundi", async () => {
    state.me = { user: USER, roles: roles() };
    await render();
    const mineCalls = state.calls.filter((c) => c.name === "fundiProfiles:mine");
    expect(mineCalls.every((c) => c.args === "skip")).toBe(true);
  });

  it("renders only strings from messages/en.json apart from the Fundi's own data", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    const allowed = new Set([...leafStrings(en), USER.name, USER.county]);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    expect(texts.length).toBeGreaterThan(0);
    for (const s of texts) expect(allowed, `hardcoded string on /fundi: "${s}"`).toContain(s);
  });

  it("says the page is unavailable, and never routes, without Convex", async () => {
    await render({ convexAvailable: false });
    expect(container.textContent).toContain(t("unavailable"));
    expect(state.replace).not.toHaveBeenCalled();
  });
});
