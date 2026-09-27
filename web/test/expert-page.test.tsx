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
  const { default: ExpertPage } = await import("@/app/(app)/expert/page");
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
    const { generateMetadata } = await import("@/app/(app)/expert/page");
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

describe("the Expert queue (US-5.1, #67 screen 28)", () => {
  const NOW = Date.UTC(2026, 8, 20, 12, 30);
  const HOUR = 3_600_000;

  beforeEach(() => {
    state.me = { user: USER, roles: roles({ base: "fundi", expert: true }) };
    vi.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const hair = (over: object = {}) =>
    row({
      tradeSlug: "hairdressing",
      tradeName: "Hairdressing",
      taskSlug: "cornrows",
      taskName: "Cornrows",
      ...over,
    });
  const readout = () => container.querySelector('[data-testid="queue-readout"]')?.textContent ?? "";
  const filter = (name: string) =>
    [...container.querySelectorAll<HTMLButtonElement>('[data-testid="trade-filter"] button')].find(
      (b) => b.textContent === name,
    );
  const click = async (el: HTMLElement | undefined | null) => {
    expect(el).toBeTruthy();
    await act(async () => el!.click());
  };

  it("titles the page 'Review queue' with the dim intro line, and a skeleton while the queue loads", async () => {
    await render();
    expect(state.replace).not.toHaveBeenCalled();
    expect(heading()).toBe(tq("title"));
    expect(tq("title")).toBe("Review queue");
    expect(container.textContent).toContain("Oldest first. You never see your own videos.");
    expect(status()?.textContent).toBe(tq("loading"));
  });

  it("says QUEUE CLEAR when nothing is waiting, with no action", async () => {
    state.queue = [];
    await render();
    expect(container.textContent).toContain(tq("empty.tag"));
    expect(container.textContent).toContain(tq("empty.body"));
    expect(rows()).toEqual([]);
    expect(container.querySelector("main button")).toBeNull();
  });

  it("shows one row per Assessment in the order given, each opening its detail", async () => {
    state.queue = [row({ assessmentId: "a1" }), hair({ assessmentId: "a2" }), row({ assessmentId: "a3" })];
    await render();
    const r = rows();
    expect(r.map((el) => el.querySelector("a")?.getAttribute("href"))).toEqual([
      "/expert/a1",
      "/expert/a2",
      "/expert/a3",
    ]);
    expect(r[0].textContent).toContain(en.Rubrics["13a-socket"].name);
    expect(r[1].textContent).toContain(en.Rubrics.cornrows.name);
  });

  it("gives each row the mono meta 'TRADE · WAITING <age>', computed from the stored time", async () => {
    state.queue = [
      row({ assessmentId: "a1", _creationTime: NOW - 3 * HOUR - 5 * 60_000 }),
      hair({ assessmentId: "a2", _creationTime: NOW - 12 * 60_000 }),
      row({ assessmentId: "a3", _creationTime: NOW - 50 * HOUR }),
      row({ assessmentId: "a4", _creationTime: NOW - 10_000 }),
    ];
    await render();
    const [a1, a2, a3, a4] = rows();
    const electrical = en.TradeCatalogue.electrical.name;
    expect(a1.textContent).toContain(tq("meta", { trade: electrical, age: tq("age.hours", { n: 3 }) }));
    expect(a2.textContent).toContain(
      tq("meta", { trade: en.TradeCatalogue.hairdressing.name, age: tq("age.minutes", { n: 12 }) }),
    );
    expect(a3.textContent).toContain(tq("meta", { trade: electrical, age: tq("age.days", { n: 2 }) }));
    expect(a4.textContent).toContain(tq("meta", { trade: electrical, age: tq("age.now") }));
  });

  it("reads out only the count by Trade and the oldest waiting age", async () => {
    state.queue = [
      row({ assessmentId: "a1", _creationTime: NOW - 3 * HOUR }),
      hair({ assessmentId: "a2", _creationTime: NOW - 2 * HOUR }),
      row({ assessmentId: "a3", _creationTime: NOW - HOUR }),
    ];
    await render();
    const text = readout();
    expect(text).toContain(tq("tradeCount", { trade: en.TradeCatalogue.electrical.name, count: 2 }));
    expect(text).toContain(tq("tradeCount", { trade: en.TradeCatalogue.hairdressing.name, count: 1 }));
    expect(text).toContain(tq("oldest", { age: tq("age.hours", { n: 3 }) }));
    // No total, pending counter or percentage.
    expect(text).not.toMatch(/%|total|pending/i);
  });

  it("filters by Trade on the client with 48 px segmented pills, All trades first and selected", async () => {
    state.queue = [row({ assessmentId: "a1" }), hair({ assessmentId: "a2" }), row({ assessmentId: "a3" })];
    await render();
    const labels = [...container.querySelectorAll('[data-testid="trade-filter"] button')].map((b) => b.textContent);
    expect(labels).toEqual([tq("allTrades"), en.TradeCatalogue.electrical.name, en.TradeCatalogue.hairdressing.name]);
    expect(filter(tq("allTrades"))?.getAttribute("aria-pressed")).toBe("true");
    for (const b of container.querySelectorAll('[data-testid="trade-filter"] button')) {
      expect(b.className).toMatch(/\bmin-h-12\b/);
      expect(b.className).not.toMatch(/bg-primary/);
    }

    await click(filter(en.TradeCatalogue.hairdressing.name));
    expect(rows().map((el) => el.querySelector("a")?.getAttribute("href"))).toEqual(["/expert/a2"]);
    expect(filter(en.TradeCatalogue.hairdressing.name)?.getAttribute("aria-pressed")).toBe("true");
    expect(filter(tq("allTrades"))?.getAttribute("aria-pressed")).toBe("false");
    // The readout still counts the whole queue.
    expect(readout()).toContain(tq("tradeCount", { trade: en.TradeCatalogue.electrical.name, count: 2 }));

    await click(filter(tq("allTrades")));
    expect(rows()).toHaveLength(3);
  });

  it("says so when the chosen Trade has emptied, with 'Show all trades'", async () => {
    state.queue = [row({ assessmentId: "a1" }), hair({ assessmentId: "a2" })];
    await render();
    await click(filter(en.TradeCatalogue.hairdressing.name));
    // The Hairdressing video is decided elsewhere; the query updates reactively.
    state.queue = [row({ assessmentId: "a1" })];
    await render();
    expect(rows()).toEqual([]);
    expect(container.textContent).toContain(tq("filteredEmpty", { trade: en.TradeCatalogue.hairdressing.name }));
    const showAll = [...container.querySelectorAll("button")].find((b) => b.textContent === tq("showAll"));
    await click(showAll);
    expect(rows()).toHaveLength(1);
  });

  it("marks a row with safety flags with a neutral outlined 'Safety check', never amber", async () => {
    state.queue = [row({ assessmentId: "a1", safetyFlagCount: 2 }), row({ assessmentId: "a2" })];
    await render();
    const [flagged, clean] = rows();
    const marker = flagged.querySelector('[data-testid="safety-check"]');
    expect(marker?.textContent).toBe(tq("safetyCheck"));
    expect(marker?.className).toMatch(/\bborder\b/);
    expect(marker?.className).toMatch(/font-mono/);
    expect(marker?.className).not.toMatch(/primary|amber/);
    expect(clean.querySelector('[data-testid="safety-check"]')).toBeNull();
  });

  it("never shows an AI chip, verdict, score or thumbnail on a row (automation bias)", async () => {
    state.queue = [row({ safetyFlagCount: 1 }), hair()];
    await render();
    for (const r of rows()) {
      const text = r.textContent ?? "";
      expect(text).not.toMatch(/\bAI\b|suggest|verdict|pass|fail|needs review|%|score|confiden/i);
      expect(r.querySelector("img, video")).toBeNull();
    }
  });

  it("has no amber fill anywhere on the queue", async () => {
    state.queue = [row({ safetyFlagCount: 1 }), hair()];
    await render();
    expect(container.innerHTML).not.toMatch(/bg-primary|text-primary|border-primary/);
  });

  it("renders only copy from messages/en.json", async () => {
    state.queue = [row({ safetyFlagCount: 3 }), hair()];
    await render();
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    expect(texts.length).toBeGreaterThan(0);
    for (const s of texts) expect(isCopy(s), `hardcoded string on /expert: "${s}"`).toBe(true);
  });
});

describe("the queue error boundary", () => {
  it("shows ✕ COULDN'T LOAD with a Try again that re-fetches, and never the error text", async () => {
    const { default: QueueError } = await import("@/app/(app)/expert/error");
    const retry = vi.fn();
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale={defaultLocale} messages={en}>
          <QueueError error={new Error("boom")} retry={retry} reset={() => {}} />
        </NextIntlClientProvider>,
      );
    });
    const text = container.textContent ?? "";
    expect(text).toContain("✕");
    expect(text).toContain(tq("error.tag"));
    expect(text).toContain(tq("error.body"));
    expect(text).not.toContain("boom");
    expect(container.innerHTML).not.toMatch(/primary/);
    const button = [...container.querySelectorAll("button")].find((b) => b.textContent === tq("error.retry"));
    await act(async () => button!.click());
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
