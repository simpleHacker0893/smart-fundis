// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "FundiPage" });
const home = createTranslator({ locale: defaultLocale, messages: en, namespace: "FundiHome" });
const chip = createTranslator({ locale: defaultLocale, messages: en, namespace: "StatusChip" });

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
  list: [] as unknown,
  myProfile: undefined as unknown,
  throws: new Set<string>(),
  queryArgs: [] as unknown[],
  calls: [] as { name: string; args: unknown }[],
  replace: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(vi.fn(), { protect: state.protect }) }));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const others: Record<string, unknown> = {
    "fundiProfiles:myShowcaseLinks": { youtube: null, tiktok: null },
  };
  return {
    useConvexAuth: () => ({ isLoading: !state.isAuthenticated, isAuthenticated: state.isAuthenticated }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      state.calls.push({ name, args });
      if (name === "users:me") state.queryArgs.push(args);
      if (args === "skip") return undefined;
      // Convex's useQuery throws a server error during render.
      if (state.throws.has(name)) throw new Error(`server error in ${name}`);
      if (name === "users:me") return state.me;
      if (name === "assessments:listMine") return state.list;
      if (name === "fundiProfiles:myProfileId") return state.myProfile;
      return others[name];
    },
    useMutation: () => vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/fundi",
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

const USER = { _id: "users_1", email: "w@example.com", name: "Wanjiru Kamau", phone: "+254712345678", county: "Kiambu" };
const roles = (r: object = {}) => ({ base: "none", expert: false, admin: false, ...r });
const FUNDI = () => ({ user: USER, roles: roles({ base: "fundi" }) });

const row = (over: object = {}) => ({
  _id: "assessments_1",
  _creationTime: Date.UTC(2026, 8, 25, 9, 30),
  status: "queued",
  tradeSlug: "electrical",
  tradeName: "Electrical",
  taskSlug: "13a-socket",
  taskName: "Install a 13A socket",
  ...over,
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.protect.mockClear();
  state.isAuthenticated = true;
  state.me = undefined;
  state.list = [];
  state.myProfile = undefined;
  state.throws = new Set();
  state.queryArgs = [];
  state.calls = [];
  state.replace.mockReset();
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

async function render({ convexAvailable = true } = {}) {
  const { default: FundiPage } = await import("@/app/(app)/fundi/page");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  // The (app) layout's provider draws the one Add video sheet.
  const { AddVideoProvider } = await import("@/components/add-video-sheet");
  const page = await FundiPage();
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <ConvexAvailableContext value={convexAvailable}>
          <AddVideoProvider>{page}</AddVideoProvider>
        </ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

const heading = () => container.querySelector("h1")?.textContent ?? null;
const status = () => container.querySelector('[role="status"]');
const text = () => (container.textContent ?? "").replace(/\s+/g, " ");
const section = (label: string) =>
  [...container.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent === label) ?? null;
const rows = () => [...container.querySelectorAll('[data-testid="verification-row"]')];

describe("/fundi page (spec §4 page guard)", () => {
  it("protects itself on the server, not only in the proxy", async () => {
    await render();
    expect(state.protect).toHaveBeenCalledTimes(1);
  });

  it("has a page title from messages", async () => {
    const { generateMetadata } = await import("@/app/(app)/fundi/page");
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
    state.me = FUNDI();
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

  it("reads no Fundi-only query for anyone else", async () => {
    state.me = { user: USER, roles: roles() };
    await render();
    const fundiOnly = ["assessments:listMine", "fundiProfiles:myShowcaseLinks", "fundiProfiles:myProfileId"];
    expect(state.calls.filter((c) => fundiOnly.includes(c.name) && c.args !== "skip")).toEqual([]);
  });

  it("says the page is unavailable, and never routes, without Convex", async () => {
    await render({ convexAvailable: false });
    expect(container.textContent).toContain(t("unavailable"));
    expect(state.replace).not.toHaveBeenCalled();
  });
});

describe("/fundi home (prompt 25)", () => {
  beforeEach(() => {
    state.me = FUNDI();
    state.myProfile = { id: "fundiProfiles_7", publicListing: true };
  });

  it("titles the page and explains it in one dim line, with no profile block", async () => {
    await render();
    expect(heading()).toBe("Get your work verified.");
    expect(text()).toContain("Record a video of one task. The AI checks it, then an Expert decides.");
    for (const gone of [USER.name, USER.county, USER.phone]) expect(text()).not.toContain(gone);
  });

  it("shows the latest 3 verifications as rows with neutral chips, each linking to its detail, and See all", async () => {
    state.list = [
      row({ _id: "a1", status: "awaiting_review" }),
      row({ _id: "a2", status: "analyzing", tradeSlug: "hairdressing", tradeName: "Hairdressing", taskSlug: "cornrows", taskName: "Cornrows" }),
      row({ _id: "a3", status: "reshoot" }),
      row({ _id: "a4", status: "approved", decidedAt: Date.UTC(2026, 8, 20) }),
    ];
    await render();
    const mine = section(home("verificationsTitle"))!;
    expect(rows()).toHaveLength(3);
    expect(rows().map((r) => r.querySelector("a")?.getAttribute("href"))).toEqual([
      "/fundi/verifications/a1",
      "/fundi/verifications/a2",
      "/fundi/verifications/a3",
    ]);
    expect(rows().map((r) => r.querySelector("[aria-hidden] + span")?.textContent)).toEqual([
      chip("awaiting_review"),
      chip("analyzing"),
      chip("reshoot"),
    ]);
    expect(rows()[1].textContent).toContain(en.Rubrics.cornrows.name);
    expect(rows()[1].textContent).toContain("Hairdressing · 25 Sep 2026");
    // Only status changes are announced, in one hidden status line; the list is not a live region.
    expect(mine.querySelector("ul")?.hasAttribute("aria-live")).toBe(false);
    expect(mine.querySelector('[data-testid="status-announcer"]')?.getAttribute("role")).toBe("status");
    const seeAll = [...mine.querySelectorAll("a")].find((a) => a.textContent === home("seeAll"));
    expect(seeAll?.getAttribute("href")).toBe("/fundi/verifications");
    // Chips are neutral: no amber, no ✓.
    for (const c of mine.querySelectorAll("[data-testid='verification-row'] span.border")) {
      expect(c.className).not.toMatch(/primary/);
      expect(c.textContent).not.toContain("✓");
    }
  });

  it("shows the empty state when there are no verifications", async () => {
    await render();
    const empty = container.querySelector('[data-testid="empty-panel"]');
    expect(empty?.textContent).toContain(en.Verifications.empty.tag);
    expect(empty?.textContent).toContain("No verifications yet. Record a video of one task. An Expert reviews it.");
    expect(rows()).toHaveLength(0);
  });

  it("shows skeleton rows while listMine loads", async () => {
    state.list = undefined;
    await render();
    const mine = section(home("verificationsTitle"))!;
    expect(mine.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("shows 'Not yet verified' with no Badge, and the Badge line when an Expert approved", async () => {
    state.list = [row({ status: "awaiting_review" })];
    await render();
    const badges = () => section(home("badgesTitle"))!;
    expect(badges().textContent).toContain("Not yet verified");
    expect(badges().querySelector('[data-testid="badge-line"]')).toBeNull();

    state.list = [row({ status: "approved", decidedAt: Date.UTC(2026, 8, 25, 10) })];
    await render();
    expect(badges().querySelector('[data-testid="badge-line"]')?.textContent).toBe(
      "Verified by Smart Fundis — Electrical: Install a 13A socket · Sep 25, 2026",
    );
    expect(badges().textContent).not.toContain("Not yet verified");
  });

  it("says Listed · Not yet verified with the line and the public profile link", async () => {
    state.list = [row()];
    await render();
    const card = section(home("listing.title"))!;
    expect(card.textContent).toContain(chip("listed_unverified"));
    expect(card.textContent).toContain("Clients can find your profile. A badge shows once an Expert approves a video.");
    const view = card.querySelector("a");
    expect(view?.getAttribute("href")).toBe("/f/fundiProfiles_7");
    expect(view?.textContent).toBe("View my public profile");
    expect(view?.className).not.toMatch(/bg-primary/);
    expect(view?.className).toMatch(/\bh-12\b/);
  });

  it("says Listed once there is a Badge, and Not showing with no link when the Listing is off", async () => {
    state.list = [row({ status: "approved", decidedAt: Date.UTC(2026, 8, 25) })];
    await render();
    const card = () => section(home("listing.title"))!;
    expect(card().textContent).toContain(`●${chip("listed")}`);
    expect(card().textContent).not.toContain(chip("listed_unverified"));

    state.myProfile = { id: "fundiProfiles_7", publicListing: false };
    await render();
    expect(card().textContent).toContain(chip("listing_off"));
    expect(card().textContent).toContain(home("listing.off"));
    expect(card().querySelector("a")).toBeNull();
    // No data exists for an Admin hide, so the state is never drawn.
    expect(text()).not.toContain(chip("hidden_by_admin"));
  });

  it("leaves the Listing card out, heading and all, when the Fundi has no profile yet", async () => {
    state.list = [row()];
    state.myProfile = null;
    await render();
    expect(section(home("listing.title"))).toBeNull();
    expect(text()).not.toContain(home("listing.title"));
    expect(rows()).toHaveLength(1);
  });

  it("lists only named missing items under Finish your profile, and hides the card when none is known", async () => {
    await render();
    const card = section(home("finish.title"))!;
    expect(card.textContent).toContain("Still to add:");
    const item = [...card.querySelectorAll("a")].find((a) => a.textContent?.includes(home("finish.items.firstVideo")));
    expect(item?.getAttribute("href")).toBe("/fundi/record");
    expect(item?.className).toMatch(/\bmin-h-12\b/);

    state.list = [row()];
    await render();
    expect(section(home("finish.title"))).toBeNull();
  });

  it("never shows a percentage, a count or a progress bar", async () => {
    for (const list of [[], [row(), row({ _id: "b", status: "approved", decidedAt: Date.UTC(2026, 8, 25) })]]) {
      state.list = list;
      await render();
      expect(text()).not.toContain("%");
      expect(text()).not.toMatch(/\b\d+\s*(of|tasks?|left|complete|active)\b/i);
      expect(container.querySelector("progress, meter, [role='progressbar'], [role='meter']")).toBeNull();
    }
  });

  it("has one amber fill, the mobile-only Add video pill; desktop keeps the sidebar pill as its one", async () => {
    state.list = [row({ status: "approved", decidedAt: Date.UTC(2026, 8, 25) })];
    await render();
    const fills = [...container.querySelectorAll<HTMLElement>("[class]")].filter((el) =>
      (el.getAttribute("class") ?? "").split(/\s+/).includes("bg-primary"),
    );
    expect(fills).toHaveLength(1);
    expect(fills[0].textContent).toBe(en.AppShell.addVideo);
    expect(fills[0].className.split(/\s+/)).toContain("lg:hidden");
  });

  it("opens the Add video sheet from the mobile pill", async () => {
    await render();
    const pill = [...container.querySelectorAll("button")].find((b) => b.textContent === en.AppShell.addVideo)!;
    const dialog = container.querySelector(`dialog[aria-label="${en.AddVideo.title}"]`)!;
    expect(dialog.hasAttribute("open")).toBe(false);
    await act(async () => pill.click());
    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("keeps a failed card inside its own error panel while the rest of the page works", async () => {
    state.list = [row()];
    state.throws = new Set(["fundiProfiles:myProfileId"]);
    await render();
    const card = section(home("listing.title"))!;
    const error = card.querySelector('[data-testid="error-panel"]');
    expect(error?.textContent).toContain("✕");
    expect(error?.textContent).toContain(en.Verifications.error.tag);
    expect(error?.textContent).toContain(en.Verifications.error.retry);
    expect(error?.className).not.toMatch(/primary/);
    expect(rows()).toHaveLength(1);

    state.throws = new Set();
    const retry = [...error!.querySelectorAll("button")].find((b) => b.textContent === en.Verifications.error.retry)!;
    await act(async () => retry.click());
    expect(section(home("listing.title"))!.querySelector('[data-testid="error-panel"]')).toBeNull();
    expect(section(home("listing.title"))!.textContent).toContain(chip("listed_unverified"));
  });

  it("renders only strings from messages/en.json apart from the Fundi's own data", async () => {
    state.list = [row(), row({ _id: "b", status: "approved", decidedAt: Date.UTC(2026, 8, 25) })];
    await render();
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    expect(texts.length).toBeGreaterThan(0);
    const glyphs = new Set(["◌", "◐", "●", "■", "↻", "○", "✕"]);
    for (const s of texts) expect(isCopy(s) || glyphs.has(s), `hardcoded string on /fundi: "${s}"`).toBe(true);
  });

  it("never says certified, confidence or AI verified", async () => {
    state.list = [row(), row({ _id: "b", status: "approved", decidedAt: Date.UTC(2026, 8, 25) })];
    await render();
    expect(text()).not.toMatch(/certif|confidence|AI verified/i);
  });
});
