// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConvexAvailableContext } from "@/components/convex-available";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages, visibleStrings } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "AppShell" });
const isFromMessages = makeIsFromMessages(en);

const state = vi.hoisted(() => ({
  pathname: "/fundi",
  push: vi.fn(),
  me: undefined as unknown,
  profile: undefined as unknown,
  user: null as unknown,
  openUserProfile: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: state.push, replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: state.user !== null, user: state.user }),
  useClerk: () => ({ openUserProfile: state.openUserProfile, signOut: state.signOut }),
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      if (args === "skip") return undefined;
      const name = getFunctionName(ref);
      if (name === "users:me") return state.me;
      if (name === "fundiProfiles:myProfileId") return state.profile;
      if (name === "fundiProfiles:myShowcaseLinks") return { youtube: null, tiktok: null };
      throw new Error(`unexpected query ${name}`);
    },
    useMutation: () => vi.fn(),
  };
});

const roles = (r: object = {}) => ({ base: "none", expert: false, admin: false, ...r });
const FUNDI = { user: { _id: "u1" }, roles: roles({ base: "fundi" }) };
const EXPERT = { user: { _id: "u1" }, roles: roles({ expert: true }) };
const BOTH = { user: { _id: "u1" }, roles: roles({ base: "fundi", expert: true }) };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.pathname = "/fundi";
  state.push.mockReset();
  state.me = FUNDI;
  state.profile = { id: "p1", publicListing: true };
  state.user = { fullName: "Wanjiku Kamau", firstName: "Wanjiku", lastName: "Kamau", primaryEmailAddress: { emailAddress: "w@example.com" } };
  state.openUserProfile.mockReset();
  state.signOut.mockReset();
  localStorage.clear();
  // jsdom has <dialog> but not showModal/close: stand in for the browser.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** The real (app) layout: the shell, its Fundi primary action and the one Add video sheet. */
async function renderShell(children: ReactNode = <p>page</p>) {
  const { default: AppLayout } = await import("@/app/(app)/layout");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <ConvexAvailableContext.Provider value={true}>
          <AppLayout>{children}</AppLayout>
        </ConvexAvailableContext.Provider>
      </NextIntlClientProvider>,
    );
  });
}

const sidebar = () => container.querySelector<HTMLElement>(`nav[aria-label="${t("menuLabel")}"]`)!;
const bottomNav = () => container.querySelector<HTMLElement>(`nav[aria-label="${t("bottomNavLabel")}"]`)!;
const dialogs = () => [...container.querySelectorAll("dialog")];
const menuSheet = () => dialogs().find((d) => d.getAttribute("aria-label") === t("sheet.menuTitle"))!;
const accountSheet = () => dialogs().find((d) => d.getAttribute("aria-label") === t("sheet.accountTitle"))!;
const addVideoSheets = () => dialogs().filter((d) => d.getAttribute("aria-label") === en.AddVideo.title);
const text = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ");
const categories = (el: Element) => [...el.querySelectorAll("[data-category]")].map((c) => c.textContent);
const rows = (el: Element) =>
  [...el.querySelectorAll<HTMLElement>("[data-nav-item]")].map((a) => ({
    label: a.getAttribute("data-nav-item"),
    href: a.getAttribute("href"),
  }));
const byText = (el: Element, selector: string, words: string) =>
  [...el.querySelectorAll<HTMLElement>(selector)].find((b) => text(b).includes(words) || b.getAttribute("aria-label") === words);

describe("AppShell, Fundi (D2, D-65)", () => {
  it("groups the sidebar menu under OVERVIEW, VERIFICATION, PROFILE and SMART FUNDIS, with ACCOUNT → Help, Sign out in the footer", async () => {
    await renderShell();
    expect(categories(sidebar())).toEqual(
      (["overview", "verification", "profile", "smartFundis", "account"] as const).map((k) => t(`categories.${k}`)),
    );
    expect(rows(sidebar())).toEqual([
      { label: t("items.home"), href: "/fundi" },
      { label: t("items.verifications"), href: "/fundi/verifications" },
      { label: t("items.publicProfile"), href: "/f/p1" },
      { label: t("items.showcase"), href: "/fundi/showcase" },
      { label: t("items.trades"), href: "/trades" },
      { label: t("items.evidence"), href: "/evidence" },
      { label: t("items.company"), href: "/about" },
      { label: t("items.help"), href: "/contact" },
      { label: t("items.signOut"), href: null },
    ]);
  });

  it("puts the Add video pill at the top of the sidebar, glow-free, opening the Add video sheet", async () => {
    await renderShell();
    const pill = byText(sidebar().parentElement!, "button", t("addVideo"))!;
    expect(pill.getAttribute("aria-haspopup")).toBe("dialog");
    expect(pill.className).toContain("bg-primary");
    expect(pill.className).not.toContain("shadow");
    await act(async () => pill.click());
    expect(addVideoSheets()[0].hasAttribute("open")).toBe(true);
  });

  it("renders the Add video sheet once, outside the desktop-only sidebar, for every trigger", async () => {
    const { AddVideoButton } = await import("@/components/add-video-sheet");
    await renderShell(<AddVideoButton className="lg:hidden" />);
    // One sheet, not inside the aside that is display:none below 1024 px: a
    // resize from 1024 to 768 px while it is open never leaves the page inert.
    expect(addVideoSheets()).toHaveLength(1);
    const sheet = addVideoSheets()[0];
    expect(sheet.closest("aside")).toBeNull();
    const mobile = [...container.querySelectorAll<HTMLButtonElement>("main button, #main-content button")].find(
      (b) => text(b) === t("addVideo"),
    )!;
    await act(async () => mobile.click());
    expect(sheet.hasAttribute("open")).toBe(true);
    await act(async () => byText(sheet, "button", t("sheet.close"))!.click());
    expect(sheet.hasAttribute("open")).toBe(false);
    // The collapsed rail's icon opens the same sheet.
    await act(async () => container.querySelector<HTMLButtonElement>("button[aria-controls]")!.click());
    const rail = byText(container.querySelector("aside")!, "button", t("addVideo"))!;
    expect(rail.getAttribute("title")).toBe(t("addVideo"));
    await act(async () => rail.click());
    expect(sheet.hasAttribute("open")).toBe(true);
    expect(addVideoSheets()).toHaveLength(1);
  });

  it("marks only the current item with aria-current, a white label and the amber bar", async () => {
    state.pathname = "/fundi/verifications/abc";
    await renderShell();
    const current = [...sidebar().querySelectorAll("[aria-current]")];
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute("aria-current")).toBe("page");
    expect(current[0].getAttribute("href")).toBe("/fundi/verifications");
    expect(current[0].className).toMatch(/text-foreground/);
    expect(current[0].className).toMatch(/before:bg-primary/);
  });

  it("hides Public profile when there is no profile or it is not listed", async () => {
    state.profile = { id: "p1", publicListing: false };
    await renderShell();
    expect(rows(sidebar()).map((r) => r.label)).not.toContain(t("items.publicProfile"));
    state.profile = null;
    await renderShell();
    expect(rows(sidebar()).map((r) => r.label)).not.toContain(t("items.publicProfile"));
  });

  it("has a bottom nav of Home, Verifications, Profile and More, with the role label in the header", async () => {
    await renderShell();
    const slots = [...bottomNav().querySelectorAll("a, button")];
    expect(slots.map(text).map((s) => s.trim())).toEqual(
      [t("bottom.home"), t("bottom.verifications"), t("bottom.profile"), t("bottom.more")],
    );
    expect(slots[2].getAttribute("href")).toBe("/fundi/showcase");
    expect(slots[0].getAttribute("aria-current")).toBe("page");
    expect(text(container.querySelector("header")!)).toContain(t("roles.fundi"));
  });

  it("opens the More sheet with the same grouped menu as the sidebar", async () => {
    await renderShell();
    const more = byText(bottomNav(), "button", t("bottom.more"))!;
    await act(async () => more.click());
    const sheet = menuSheet();
    expect(sheet.hasAttribute("open")).toBe(true);
    expect(categories(sheet)).toEqual(categories(sidebar()));
    expect(rows(sheet)).toEqual(rows(sidebar()));
    expect(sheet.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/fundi");
    const close = byText(sheet, "button", t("sheet.close"))!;
    await act(async () => close.click());
    expect(sheet.hasAttribute("open")).toBe(false);
  });

  it("never shows History, and renders only strings from en.json", async () => {
    state.user = null;
    await renderShell(null);
    const markup = container.innerHTML;
    expect(markup).not.toMatch(/history/i);
    for (const s of visibleStrings(markup)) {
      expect(isFromMessages(s), `hardcoded string: "${s}"`).toBe(true);
    }
  });

  it("signs out through Clerk", async () => {
    await renderShell();
    await act(async () => byText(sidebar(), "button", t("items.signOut"))!.click());
    expect(state.signOut).toHaveBeenCalledTimes(1);
  });

  it("styles the skip link white on graphite when focused, never an amber fill", async () => {
    await renderShell();
    const skip = container.querySelector<HTMLAnchorElement>('a[href="#main-content"]')!;
    expect(text(skip)).toBe(t("skipToContent"));
    expect(skip.className).not.toMatch(/primary/);
    expect(skip.className).toMatch(/focus:bg-foreground/);
    expect(skip.className).toMatch(/focus:text-background/);
  });
});

describe("AppShell, Expert", () => {
  beforeEach(() => {
    state.pathname = "/expert/assessment_1";
    state.me = EXPERT;
  });

  it("groups REVIEW, SMART FUNDIS, then ACCOUNT → Profile, Help, Sign out; marks Queue current on a review page; has no primary pill", async () => {
    await renderShell();
    expect(categories(sidebar())).toEqual(
      (["review", "smartFundis", "account"] as const).map((k) => t(`categories.${k}`)),
    );
    expect(rows(sidebar())).toEqual([
      { label: t("items.queue"), href: "/expert" },
      { label: t("items.trades"), href: "/trades" },
      { label: t("items.evidence"), href: "/evidence" },
      { label: t("items.company"), href: "/about" },
      { label: t("items.profile"), href: null },
      { label: t("items.help"), href: "/contact" },
      { label: t("items.signOut"), href: null },
    ]);
    expect(sidebar().querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/expert");
    expect(container.innerHTML).not.toContain(t("addVideo"));
    expect(container.innerHTML).not.toMatch(/history/i);
    expect(text(container.querySelector("header")!)).toContain(t("roles.expert"));
  });

  it("has a bottom nav of Queue, Profile and More; Profile opens Clerk's account page", async () => {
    await renderShell();
    const slots = [...bottomNav().querySelectorAll("a, button")];
    expect(slots.map(text).map((s) => s.trim())).toEqual([t("bottom.queue"), t("bottom.profile"), t("bottom.more")]);
    await act(async () => (slots[1] as HTMLElement).click());
    expect(state.openUserProfile).toHaveBeenCalledTimes(1);
  });
});

describe("avatar sheet and role switch", () => {
  async function openAccount() {
    const avatar = container.querySelector<HTMLButtonElement>(`header button[aria-label="${t("avatar.open")}"]`)!;
    expect(text(avatar)).toContain("WK");
    await act(async () => avatar.click());
    return accountSheet();
  }

  it("shows initials, name, email, Manage account and Sign out; no role switch for one role", async () => {
    await renderShell();
    const sheet = await openAccount();
    expect(sheet.hasAttribute("open")).toBe(true);
    expect(text(sheet)).toContain("Wanjiku Kamau");
    expect(text(sheet)).toContain("w@example.com");
    expect(sheet.querySelector("img")).toBeNull();
    expect(sheet.querySelectorAll("[aria-pressed]")).toHaveLength(0);
    expect(text(sheet)).not.toContain(t("switcher.legend"));
    await act(async () => byText(sheet, "button", t("avatar.manage"))!.click());
    expect(state.openUserProfile).toHaveBeenCalledTimes(1);
  });

  const roleButtons = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")];

  it("shows the DASHBOARD switch to a Fundi who is also an Expert, and choosing a role goes to that home", async () => {
    state.me = BOTH;
    await renderShell();
    const sheet = await openAccount();
    const [fundi, expert] = roleButtons(sheet);
    expect(roleButtons(sheet)).toHaveLength(2);
    expect(text(fundi)).toContain(t("switcher.fundi"));
    expect(fundi.getAttribute("aria-pressed")).toBe("true");
    expect(text(fundi)).toContain(t("switcher.current"));
    expect(expert.getAttribute("aria-pressed")).toBe("false");
    expect(text(expert)).not.toContain(t("switcher.current"));
    await act(async () => fundi.click());
    expect(state.push).not.toHaveBeenCalled();
    await act(async () => expert.click());
    expect(state.push).toHaveBeenCalledWith("/expert");
  });

  it("never navigates on arrow keys: only an explicit click or Enter switches (WCAG 3.2.2)", async () => {
    state.me = BOTH;
    await renderShell();
    const sheet = await openAccount();
    expect(sheet.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    const [fundi] = roleButtons(sheet);
    fundi.focus();
    for (const key of ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"]) {
      await act(async () => {
        fundi.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
    }
    expect(state.push).not.toHaveBeenCalled();
    // Every row is a real button, so Enter and Space activate it natively.
    for (const button of roleButtons(sheet)) expect(button.type).toBe("button");
  });

  it("also puts the DASHBOARD switch in the desktop sidebar footer, only for a dual-role User", async () => {
    await renderShell();
    const aside = () => container.querySelector("aside")!;
    expect(roleButtons(aside())).toHaveLength(0);

    state.me = BOTH;
    await renderShell();
    const buttons = roleButtons(aside());
    expect(buttons).toHaveLength(2);
    // It sits in the footer, just above the ACCOUNT group.
    const account = [...aside().querySelectorAll("[data-category]")].find((c) => c.textContent === t("categories.account"))!;
    expect(buttons[1].compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await act(async () => buttons[1].click());
    expect(state.push).toHaveBeenCalledWith("/expert");
  });
});

describe("collapsible sidebar", () => {
  const toggle = () => container.querySelector<HTMLButtonElement>("button[aria-controls]")!;

  it("collapses to a 64 px icon rail whose items keep their names and a title tooltip", async () => {
    await renderShell();
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    await act(async () => toggle().click());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(toggle().getAttribute("aria-label")).toBe(t("expand"));
    const aside = container.querySelector("aside")!;
    expect(aside.getAttribute("data-collapsed")).toBe("true");
    expect(aside.className).toMatch(/lg:w-16/);
    const home = sidebar().querySelector<HTMLElement>('[data-nav-item][href="/fundi"]')!;
    expect(home.getAttribute("title")).toBe(t("items.home"));
    expect(text(home)).toContain(t("items.home"));
    expect(localStorage.getItem("sf.sidebar.collapsed")).toBe("1");
  });

  it("restores the saved state", async () => {
    localStorage.setItem("sf.sidebar.collapsed", "1");
    await renderShell();
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("still renders and toggles when localStorage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await renderShell();
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    await act(async () => toggle().click());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });
});

describe("connection states (D9)", () => {
  it("shows the offline strip with the time, then Back online for 3 s", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(new Date("2026-09-27T11:05:00Z")); // 14:05 in Nairobi
    let online = true;
    vi.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
    await renderShell();
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(text(live).trim()).toBe("");

    online = false;
    await act(async () => window.dispatchEvent(new Event("offline")));
    expect(text(live)).toContain(t("connection.offline", { time: "14:05" }));

    online = true;
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(text(live)).toContain(t("connection.back"));
    expect(text(live)).not.toContain(t("connection.offline", { time: "14:05" }));

    await act(async () => vi.advanceTimersByTime(3000));
    expect(text(live).trim()).toBe("");
  });
});
