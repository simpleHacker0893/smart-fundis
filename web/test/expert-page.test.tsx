// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "ExpertPage" });
const tq = createTranslator({ locale: defaultLocale, messages: en, namespace: "ReviewQueue" });

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
  queue: undefined as unknown,
  calls: [] as { name: string; args: unknown }[],
  replace: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(vi.fn(), { protect: state.protect }) }));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    useConvexAuth: () => ({ isLoading: !state.isAuthenticated, isAuthenticated: state.isAuthenticated }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      state.calls.push({ name, args });
      if (args === "skip") return undefined;
      if (name === "users:me") return state.me;
      if (name === "reviews:queue") return state.queue;
      return undefined;
    },
    useMutation: () => vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

const USER = { _id: "users_1", email: "e@example.com", name: "Otieno Ouma" };
const roles = (r: object = {}) => ({ base: "none", expert: false, admin: false, ...r });

const row = (over: object = {}) => ({
  assessmentId: "assessments_1",
  _creationTime: Date.UTC(2026, 8, 20, 9, 30),
  tradeSlug: "electrical",
  tradeName: "Electrical",
  taskSlug: "13a-socket",
  taskName: "Install a 13A socket",
  verdict: "pass",
  safetyFlagCount: 0,
  ...over,
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.protect.mockClear();
  state.isAuthenticated = true;
  state.me = undefined;
  state.queue = undefined;
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
  const { default: ExpertPage } = await import("@/app/(site)/expert/page");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  const page = await ExpertPage();
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <ConvexAvailableContext value={convexAvailable}>{page}</ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

const heading = () => container.querySelector("h1")?.textContent ?? null;
const status = () => container.querySelector('[role="status"]');
const rows = () => [...container.querySelectorAll('[data-testid="queue-row"]')];

describe("/expert page (spec §4 page guard)", () => {
  it("protects itself on the server, not only in the proxy", async () => {
    await render();
    expect(state.protect).toHaveBeenCalledTimes(1);
  });

  it("has a page title from messages", async () => {
    const { generateMetadata } = await import("@/app/(site)/expert/page");
    expect((await generateMetadata()).title).toBe(t("meta.title"));
  });

  it("shows a skeleton and does not route while users.me is loading or signed out", async () => {
    await render();
    expect(status()?.textContent).toBe(t("loading"));
    expect(heading()).toBeNull();
    state.me = null;
    await render();
    expect(status()?.textContent).toBe(t("loading"));
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("sends a Fundi who is not an Expert back to /dashboard, and never reads the queue", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    state.queue = [row()];
    await render();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(heading()).toBeNull();
    expect(state.calls.filter((c) => c.name === "reviews:queue" && c.args !== "skip")).toEqual([]);
  });

  it("sends an Admin who is not an Expert back to /dashboard", async () => {
    state.me = { user: USER, roles: roles({ admin: true }) };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("says the page is unavailable, and never routes, without Convex", async () => {
    await render({ convexAvailable: false });
    expect(container.textContent).toContain(t("unavailable"));
    expect(state.replace).not.toHaveBeenCalled();
  });
});

describe("the Expert queue (US-5.1)", () => {
  beforeEach(() => {
    state.me = { user: USER, roles: roles({ base: "fundi", expert: true }) };
  });

  it("shows the heading and a skeleton while the queue loads", async () => {
    await render();
    expect(state.replace).not.toHaveBeenCalled();
    expect(heading()).toBe(t("title"));
    expect(status()?.textContent).toBe(tq("loading"));
  });

  it("says so when nothing is waiting", async () => {
    state.queue = [];
    await render();
    expect(container.textContent).toContain(tq("empty"));
    expect(rows()).toEqual([]);
  });

  it("shows one row per Assessment in the order given, each opening its detail", async () => {
    state.queue = [
      row({ assessmentId: "a1" }),
      row({
        assessmentId: "a2",
        _creationTime: Date.UTC(2026, 8, 21, 9, 30),
        tradeSlug: "hairdressing",
        tradeName: "Hairdressing",
        taskSlug: "cornrows",
        taskName: "Cornrows",
        verdict: "needs_review",
        safetyFlagCount: 2,
      }),
      row({ assessmentId: "a3", verdict: "fail", safetyFlagCount: 1 }),
      row({ assessmentId: "a4", verdict: undefined }),
    ];
    await render();
    const r = rows();
    expect(r).toHaveLength(4);
    expect(r.map((el) => el.querySelector("a")?.getAttribute("href"))).toEqual([
      "/expert/a1",
      "/expert/a2",
      "/expert/a3",
      "/expert/a4",
    ]);
    expect(r[0].textContent).toContain(`${en.TradeCatalogue.electrical.name}: ${en.Rubrics["13a-socket"].name}`);
    expect(r[1].textContent).toContain(`${en.TradeCatalogue.hairdressing.name}: ${en.Rubrics.cornrows.name}`);
    expect(r[0].textContent).toContain("Sep 20, 2026");
    // W2 (rai major, automation bias): the queue row never names the AI's
    // recommendation, only the safety-flag count. The labelled AI suggestion
    // panel lives on the detail view instead.
    for (const row of r) {
      expect(row.textContent).not.toMatch(/AI suggestion/i);
      for (const verdict of Object.values(en.ReviewQueue.verdict)) expect(row.textContent).not.toContain(verdict);
    }
    expect(r[0].textContent).toContain(tq("safetyFlags", { count: 0 }));
    expect(r[1].textContent).toContain(tq("safetyFlags", { count: 2 }));
    expect(r[2].textContent).toContain(tq("safetyFlags", { count: 1 }));
  });

  it("renders only copy from messages/en.json", async () => {
    state.queue = [row({ safetyFlagCount: 3 })];
    await render();
    // makeIsFromMessages does not expand ICU plurals, so the one plural line is checked as rendered.
    const fromMessages = makeIsFromMessages(en);
    const isCopy = (s: string) => fromMessages(s) || s === tq("safetyFlags", { count: 3 });
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    expect(texts.length).toBeGreaterThan(0);
    for (const s of texts) expect(isCopy(s), `hardcoded string on /expert: "${s}"`).toBe(true);
  });
});
