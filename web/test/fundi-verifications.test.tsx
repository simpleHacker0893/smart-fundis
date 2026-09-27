// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const v = createTranslator({ locale: defaultLocale, messages: en, namespace: "Verifications" });
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

/** A stand-in for the Convex subscription: `push` delivers a new listMine result in place. */
const live = vi.hoisted(() => {
  let value: unknown;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    push(next: unknown) {
      value = next;
      for (const l of listeners) l();
    },
    reset(next: unknown) {
      value = next;
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
});

const state = vi.hoisted(() => ({
  protect: vi.fn(async () => ({ userId: "user_123" })),
  me: undefined as unknown,
  throws: false,
  replace: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(vi.fn(), { protect: state.protect }) }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/fundi/verifications",
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const { useSyncExternalStore } = await import("react");
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      const value = useSyncExternalStore(live.subscribe, live.get);
      if (args === "skip") return undefined;
      if (name === "users:me") return state.me;
      if (name === "assessments:listMine") {
        if (state.throws) throw new Error("server error");
        return value;
      }
      if (name === "fundiProfiles:myShowcaseLinks") return { youtube: null, tiktok: null };
      if (name === "trades:uploadPicker") return [];
      if (name === "assessments:currentLivenessCode") return null;
      throw new Error(`unexpected query ${name}`);
    },
    useMutation: () => vi.fn(),
  };
});

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
  live.reset(undefined);
  state.me = { user: { _id: "users_1" }, roles: { base: "fundi", expert: false, admin: false } };
  state.throws = false;
  state.protect.mockClear();
  state.replace.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

async function mount(node: ReactNode) {
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  // The (app) layout's provider draws the one Add video sheet.
  const { AddVideoProvider } = await import("@/components/add-video-sheet");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <ConvexAvailableContext value={true}>
          <AddVideoProvider>{node}</AddVideoProvider>
        </ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

async function renderList() {
  const { VerificationList } = await import("@/app/(app)/fundi/verifications/verification-list");
  await mount(<VerificationList />);
}

async function renderDetail(id = "assessments_1") {
  const { VerificationDetail } = await import("@/app/(app)/fundi/verifications/[id]/verification-detail");
  await mount(<VerificationDetail id={id} />);
}

const text = () => (container.textContent ?? "").replace(/\s+/g, " ");
const rows = () => [...container.querySelectorAll('[data-testid="verification-row"]')];
const chipText = (el: ParentNode) => el.querySelector("[aria-hidden] + span")?.textContent;
const buttonOrLink = (name: string) =>
  [...container.querySelectorAll<HTMLElement>("a, button")].find((el) => el.textContent === name) ?? null;

describe("/fundi/verifications, the list (prompt 27)", () => {
  it("shows every Assessment newest first as hairline rows with the task, mono meta and a neutral chip", async () => {
    live.reset([
      row({ _id: "a1", status: "approved", decidedAt: Date.UTC(2026, 8, 26) }),
      row({ _id: "a2", status: "awaiting_review", _creationTime: Date.UTC(2026, 8, 24) }),
      row({ _id: "a3", status: "failed", tradeSlug: "hairdressing", tradeName: "Hairdressing", taskSlug: "cornrows", taskName: "Cornrows" }),
      row({ _id: "a4", status: "reshoot" }),
    ]);
    await renderList();
    expect(container.querySelector("h1")?.textContent).toBe("My verifications");
    expect(rows()).toHaveLength(4);
    expect(rows().map((r) => r.querySelector("a")?.getAttribute("href"))).toEqual([
      "/fundi/verifications/a1",
      "/fundi/verifications/a2",
      "/fundi/verifications/a3",
      "/fundi/verifications/a4",
    ]);
    expect(rows().map((r) => chipText(r))).toEqual([chip("approved"), chip("awaiting_review"), chip("failed"), chip("reshoot")]);
    expect(rows()[1].textContent).toContain("Electrical · 24 Sep 2026");
    expect(rows()[2].textContent).toContain(en.Rubrics.cornrows.name);
    // The meta line is mono and uppercased by CSS.
    const meta = [...rows()[0].querySelectorAll("span")].find((s) => s.textContent?.startsWith("Electrical ·"));
    expect(meta?.className).toMatch(/\bfont-mono\b/);
    expect(meta?.className).toMatch(/\buppercase\b/);
    expect(rows()[0].querySelector("a")?.className).toMatch(/\bmin-h-14\b/);
  });

  it("changes a chip in place when the status changes (live query, no polling)", async () => {
    live.reset([row({ status: "queued" })]);
    await renderList();
    await act(async () => live.push([row({ status: "analyzing" })]));
    expect(chipText(rows()[0])).toBe(chip("analyzing"));
  });

  it("announces a status change in one polite status line, never every row Show more adds", async () => {
    const many = (status: string) => Array.from({ length: 30 }, (_, i) => row({ _id: `a${i}`, status: i === 0 ? status : "queued" }));
    live.reset(many("queued"));
    await renderList();
    // The list itself is not a live region.
    expect(container.querySelector("ul")?.hasAttribute("aria-live")).toBe(false);
    const announcer = container.querySelector('[data-testid="status-announcer"]')!;
    expect(announcer.getAttribute("role")).toBe("status");
    expect(announcer.className).toMatch(/\bsr-only\b/);
    expect(announcer.textContent).toBe("");

    await act(async () => buttonOrLink(v("showMore"))!.click());
    expect(rows()).toHaveLength(30);
    expect(announcer.textContent).toBe("");

    await act(async () => live.push(many("analyzing")));
    expect(announcer.textContent).toBe(v("statusChanged", { task: en.Rubrics["13a-socket"].name, status: chip("analyzing") }));
  });

  it("shows 24 rows, then Show more", async () => {
    live.reset(Array.from({ length: 30 }, (_, i) => row({ _id: `a${i}` })));
    await renderList();
    expect(rows()).toHaveLength(24);
    await act(async () => buttonOrLink(v("showMore"))!.click());
    expect(rows()).toHaveLength(30);
    expect(buttonOrLink(v("showMore"))).toBeNull();
  });

  it("shows the empty state, loading skeleton and a scoped error", async () => {
    live.reset([]);
    await renderList();
    expect(container.querySelector('[data-testid="empty-panel"]')?.textContent).toContain(
      "No verifications yet. Record a video of one task. An Expert reviews it.",
    );

    live.reset(undefined);
    await renderList();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    state.throws = true;
    await renderList();
    const error = container.querySelector('[data-testid="error-panel"]');
    expect(error?.textContent).toContain(v("error.tag"));
    expect(error?.textContent).toContain(v("error.body"));
    expect(container.querySelector("h1")?.textContent).toBe("My verifications");
  });

  it("has one amber fill, the mobile-only Add video pill", async () => {
    live.reset([row()]);
    await renderList();
    const fills = [...container.querySelectorAll("[class]")].filter((el) =>
      (el.getAttribute("class") ?? "").split(/\s+/).includes("bg-primary"),
    );
    expect(fills).toHaveLength(1);
    expect((fills[0].getAttribute("class") ?? "").split(/\s+/)).toContain("lg:hidden");
  });
});

describe("/fundi/verifications/[id], the detail (prompt 27, §11.0)", () => {
  const detail = async (over: object) => {
    live.reset([row({ _id: "other", status: "queued" }), row(over)]);
    await renderDetail();
  };

  it("has a back link, the title, mono meta and the chip", async () => {
    await detail({ status: "queued" });
    const back = buttonOrLink(v("back"));
    expect(back?.getAttribute("href")).toBe("/fundi/verifications");
    expect(container.querySelector("h1")?.textContent).toBe(en.Rubrics["13a-socket"].name);
    expect(text()).toContain("Electrical · Recorded 25 Sep 2026");
    expect(chipText(container.querySelector('[data-testid="detail-status"]')!)).toBe(chip("queued"));
  });

  it.each([
    ["queued", "Waiting in line for the AI check."],
    ["analyzing", "The AI is watching your video."],
    ["awaiting_review", "An Expert will review your video."],
    ["failed", "Something went wrong on our side — please record again."],
  ])("says the %s status line", async (status, line) => {
    await detail({ status });
    expect(text()).toContain(line);
    expect(chipText(container.querySelector('[data-testid="detail-status"]')!)).toBe(chip(status as never));
  });

  it("offers Record again on failed, with a neutral ✕", async () => {
    await detail({ status: "failed" });
    expect(buttonOrLink(v("recordAgain"))?.getAttribute("href")).toBe("/fundi/record");
    expect(text()).toContain("✕");
    expect(container.innerHTML).not.toMatch(/text-primary|border-primary/);
  });

  it("renders awaiting_review with identical markup whatever the AI's Verdict (D-50)", async () => {
    await detail({ status: "awaiting_review", verdict: "pass", confidence: 0.93 });
    const pass = container.innerHTML;
    await detail({ status: "awaiting_review", verdict: "needs_review", safetyFlag: true });
    expect(container.innerHTML).toBe(pass);
    expect(text()).not.toContain(v("expertNote"));
    expect(buttonOrLink(v("recordAgain"))).toBeNull();
  });

  it("gives the video check's reason on a guard reshoot, with Record again", async () => {
    await detail({ status: "reshoot", reshootReason: { code: "too_dark", en: "server text" } });
    expect(text()).toContain(en.AssessmentList.reshootReasons.too_dark);
    expect(text()).not.toContain("server text");
    expect(text()).not.toContain(v("expertNote"));
    expect(buttonOrLink(v("recordAgain"))?.getAttribute("href")).toBe("/fundi/record");
  });

  it("shows EXPERT'S NOTE on an Expert's reshoot, heavier than the rest, with Record again", async () => {
    await detail({ status: "reshoot", expertNote: "Please show the tester on each wire.", decidedAt: Date.UTC(2026, 8, 26) });
    const note = container.querySelector('[data-testid="expert-note"]');
    expect(note?.textContent).toContain(v("expertNote"));
    expect(note?.textContent).toContain("Please show the tester on each wire.");
    expect(text()).toContain(en.AssessmentList.reshootByExpert);
    expect(buttonOrLink(v("recordAgain"))?.getAttribute("href")).toBe("/fundi/record");
  });

  it("shows the Expert's note on rejected, and no Appeal or Delete (V4)", async () => {
    await detail({ status: "rejected", expertNote: "The breaker is never shown off.", decidedAt: Date.UTC(2026, 8, 26) });
    expect(container.querySelector('[data-testid="expert-note"]')?.textContent).toContain("The breaker is never shown off.");
    expect(text()).toContain(en.AssessmentList.rejectedNote);
    expect(text()).not.toMatch(/appeal|delete/i);
  });

  it("shows the Badge line on approved and never an Expert's note, even if one arrives", async () => {
    await detail({ status: "approved", decidedAt: Date.UTC(2026, 8, 25, 10), expertNote: "private approve note" });
    expect(container.querySelector('[data-testid="badge-line"]')?.textContent).toBe(
      "Verified by Smart Fundis — Electrical: Install a 13A socket · Sep 25, 2026",
    );
    expect(container.querySelector('[data-testid="expert-note"]')).toBeNull();
    expect(text()).not.toContain("private approve note");
    expect(text()).not.toContain(v("expertNote"));
  });

  it("shows no AI panel, video player, score or banned word on any status", async () => {
    for (const status of ["queued", "analyzing", "awaiting_review", "approved", "reshoot", "rejected", "failed", "appealed"]) {
      await detail({ status, decidedAt: Date.UTC(2026, 8, 25), expertNote: status === "approved" ? "x" : "note" });
      expect(text(), status).not.toMatch(/certif|confidence|AI verified|AI suggestion|The AI noticed|%/i);
      expect(container.querySelector("video, iframe, progress, meter"), status).toBeNull();
    }
  });

  it("says it couldn't find a verification that isn't the Fundi's, with a way back", async () => {
    live.reset([row({ _id: "other" })]);
    await renderDetail("assessments_missing");
    expect(text()).toContain("We couldn't find this verification.");
    expect(buttonOrLink(v("notFound.back"))?.getAttribute("href")).toBe("/fundi/verifications");
  });

  it("shows a skeleton while loading, and a scoped error on failure", async () => {
    await renderDetail();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    state.throws = true;
    await renderDetail();
    expect(container.querySelector('[data-testid="error-panel"]')).not.toBeNull();
    expect(buttonOrLink(v("back"))?.getAttribute("href")).toBe("/fundi/verifications");
  });

  it("renders only copy from messages/en.json, apart from the Expert's own note", async () => {
    const isCopy = makeIsFromMessages(en);
    const glyphs = new Set(["◌", "◐", "●", "■", "↻", "○", "✕"]);
    for (const over of [
      { status: "rejected", expertNote: "Their note." },
      { status: "approved", decidedAt: Date.UTC(2026, 8, 25) },
      { status: "failed" },
    ]) {
      await detail(over);
      const texts = [...container.querySelectorAll("*")]
        .flatMap((el) => [...el.childNodes])
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? "")
        .filter((s) => s && s !== "Their note.");
      for (const s of texts) expect(isCopy(s) || glyphs.has(s), `hardcoded string: "${s}"`).toBe(true);
    }
  });
});

describe("every Fundi page is guarded (spec §4)", () => {
  it.each([
    ["verifications", async () => (await import("@/app/(app)/fundi/verifications/page")).default()],
    [
      "verifications/[id]",
      async () =>
        (await import("@/app/(app)/fundi/verifications/[id]/page")).default({ params: Promise.resolve({ id: "a1" }) }),
    ],
    ["record", async () => (await import("@/app/(app)/fundi/record/page")).default()],
    ["showcase", async () => (await import("@/app/(app)/fundi/showcase/page")).default()],
  ])("/fundi/%s protects itself and sends a non-Fundi back to /dashboard", async (_name, page) => {
    const element = await page();
    expect(state.protect).toHaveBeenCalledTimes(1);
    state.me = { user: { _id: "users_1" }, roles: { base: "none", expert: true, admin: false } };
    await mount(element);
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(container.querySelector("h1")).toBeNull();
  });

  it.each([
    ["verifications", async () => (await import("@/app/(app)/fundi/verifications/page")).generateMetadata(), en.Verifications.meta.title],
    ["record", async () => (await import("@/app/(app)/fundi/record/page")).generateMetadata(), en.RecordPage.meta.title],
    ["showcase", async () => (await import("@/app/(app)/fundi/showcase/page")).generateMetadata(), en.ShowcasePage.meta.title],
  ])("/fundi/%s has a title from messages", async (_name, meta, title) => {
    expect((await meta()).title).toBe(title);
  });
});

describe("/fundi/record and /fundi/showcase", () => {
  it("puts the upload flow on /fundi/record under its own title", async () => {
    const { default: RecordPage } = await import("@/app/(app)/fundi/record/page");
    await mount(await RecordPage());
    expect(container.querySelector("h1")?.textContent).toBe(en.RecordPage.title);
    expect(text()).toContain(en.UploadFlow.steps.pick);
  });

  it("puts the Showcase links on /fundi/showcase with the Showcase tag", async () => {
    const { default: ShowcasePage } = await import("@/app/(app)/fundi/showcase/page");
    await mount(await ShowcasePage());
    expect(container.querySelector("h1")?.textContent).toBe(en.ShowcasePage.title);
    expect(text()).toContain(en.Showcase.label);
    expect(text()).toContain(en.Showcase.slots.youtube.label);
    expect(container.innerHTML).not.toMatch(/bg-primary/);
  });
});
