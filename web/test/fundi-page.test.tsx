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
  list: [] as unknown[],
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
    "assessments:currentLivenessCode": null,
    "fundiProfiles:myShowcaseLinks": { youtube: null, tiktok: null },
  };
  return {
    useConvexAuth: () => ({ isLoading: !state.isAuthenticated, isAuthenticated: state.isAuthenticated }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      state.calls.push({ name, args });
      if (name === "users:me") state.queryArgs.push(args);
      if (args === "skip") return undefined;
      if (name === "users:me") return state.me;
      if (name === "assessments:listMine") return state.list;
      return others[name];
    },
    useMutation: () => vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

const USER = { _id: "users_1", email: "w@example.com", name: "Wanjiru Kamau", phone: "+254712345678", county: "Kiambu" };
const roles = (r: object = {}) => ({ base: "none", expert: false, admin: false, ...r });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.protect.mockClear();
  state.isAuthenticated = true;
  state.me = undefined;
  state.list = [];
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

  it("shows a Fundi the heading and the upload flow, with no profile block (operator, 2026-09-26)", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    expect(state.replace).not.toHaveBeenCalled();
    expect(heading()).toBe(t("title"));
    expect(status()).toBeNull();
    const text = container.textContent ?? "";
    expect(text).toContain(en.UploadFlow.title);
    // "Remove this from the page … allow easy upload": no name, county or Trades list.
    for (const gone of [USER.name, USER.county, USER.phone, t("name"), t("county"), "Your Trades"]) {
      expect(text).not.toContain(gone);
    }
  });

  it("shows the Assessment list only once the Fundi has an Assessment", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    const h2s = () => [...container.querySelectorAll("h2")].map((h) => h.textContent);
    expect(h2s()).not.toContain(en.AssessmentList.title);

    state.list = [
      {
        _id: "a1",
        _creationTime: Date.UTC(2026, 8, 26),
        status: "queued",
        tradeSlug: "electrical",
        tradeName: "Electrical",
        taskSlug: "13a-socket",
        taskName: "Install a 13A socket",
      },
    ];
    await render();
    expect(h2s()).toContain(en.AssessmentList.title);
  });

  it("puts the Showcase links in their own section below the upload and the Assessment list (US-3.8)", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    state.list = [
      {
        _id: "a1",
        _creationTime: Date.UTC(2026, 8, 26),
        status: "queued",
        tradeSlug: "electrical",
        tradeName: "Electrical",
        taskSlug: "13a-socket",
        taskName: "Install a 13A socket",
      },
    ];
    await render();
    const h2s = [...container.querySelectorAll("h2")].map((h) => h.textContent);
    expect(h2s).toEqual([en.UploadFlow.title, en.AssessmentList.title, en.Showcase.title]);
    expect(state.calls.some((c) => c.name === "fundiProfiles:myShowcaseLinks" && c.args !== "skip")).toBe(true);
    const showcase = container.querySelectorAll("section")[2];
    expect(showcase.textContent).toContain(en.Showcase.intro);
    expect(showcase.querySelector("h2")?.textContent).toBe(en.Showcase.title);
  });

  it("reads no Fundi-only query for anyone else", async () => {
    state.me = { user: USER, roles: roles() };
    await render();
    const fundiOnly = [
      "assessments:listMine",
      "trades:uploadPicker",
      "assessments:currentLivenessCode",
      "fundiProfiles:myShowcaseLinks",
    ];
    expect(state.calls.filter((c) => fundiOnly.includes(c.name) && c.args !== "skip")).toEqual([]);
  });

  it("renders only strings from messages/en.json apart from the Fundi's own data", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    const allowed = new Set(leafStrings(en));
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
