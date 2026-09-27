// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "AssessmentList" });

/**
 * A stand-in for the Convex subscription: `push` delivers a new listMine
 * result to the mounted component, the way a Convex query update does,
 * without remounting or refetching (US-3.1, US-4.1).
 */
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
    mounts: 0,
  };
});

vi.mock("convex/react", async () => {
  const { useSyncExternalStore, useEffect } = await import("react");
  return {
    useQuery: (_ref: unknown, args: unknown) => {
      const value = useSyncExternalStore(live.subscribe, live.get);
      useEffect(() => {
        live.mounts += 1;
      }, []);
      return args === "skip" ? undefined : value;
    },
  };
});

const row = (over: object = {}) => ({
  _id: "assessments_1",
  _creationTime: Date.UTC(2026, 8, 26, 9, 30),
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
  live.mounts = 0;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render() {
  const { AssessmentList } = await import("@/app/(app)/fundi/assessment-list");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <AssessmentList />
      </NextIntlClientProvider>,
    );
  });
}

const chips = () => [...container.querySelectorAll('[data-testid="status-chip"]')].map((el) => el.textContent);
const items = () => [...container.querySelectorAll('[data-testid="assessment"]')];

describe("the Fundi's Assessment list (US-3.1, US-4.1)", () => {
  it("shows nothing while listMine loads or when there are no Assessments, so the upload comes first", async () => {
    await render();
    expect(container.innerHTML).toBe("");
    await act(async () => live.push([]));
    expect(container.innerHTML).toBe("");
    await act(async () => live.push([row()]));
    expect(container.querySelector("h2")?.textContent).toBe(t("title"));
  });

  it("shows each Assessment's Trade, Task and plain status (spec #36 decision 4)", async () => {
    live.reset([
      row({ _id: "a1", status: "queued" }),
      row({ _id: "a2", status: "analyzing", tradeSlug: "hairdressing", tradeName: "Hairdressing", taskSlug: "cornrows", taskName: "Cornrows" }),
      row({ _id: "a3", status: "awaiting_review" }),
      row({ _id: "a4", status: "approved" }),
      row({ _id: "a5", status: "failed" }),
    ]);
    await render();
    expect(chips()).toEqual([
      t("status.queued"),
      t("status.analyzing"),
      t("status.awaiting_review"),
      t("status.approved"),
      t("status.failed"),
    ]);
    expect(t("status.queued")).toBe("Waiting in line");
    expect(t("status.analyzing")).toBe("The AI is watching your video");
    expect(t("status.awaiting_review")).toBe("Awaiting expert review");
    expect(t("status.failed")).toBe("Something went wrong — record again");
    expect(t("status.approved")).toContain("Verified by Smart Fundis");
    expect(items()[1].textContent).toContain(`${en.TradeCatalogue.hairdressing.name}: ${en.Rubrics.cornrows.name}`);
  });

  it("gives the reason with a reshoot, and a line for a reshoot an Expert asked for", async () => {
    live.reset([
      row({ _id: "a1", status: "reshoot", reshootReason: { code: "too_dark", en: "server text", sw: "x" } }),
      row({ _id: "a2", status: "reshoot" }),
    ]);
    await render();
    expect(items()[0].textContent).toContain(t("reshootReasons.too_dark"));
    expect(items()[0].textContent).not.toContain("server text");
    expect(items()[1].textContent).toContain(t("reshootByExpert"));
  });

  it("gives a line with a rejection", async () => {
    live.reset([row({ status: "rejected" })]);
    await render();
    expect(chips()).toEqual([t("status.rejected")]);
    expect(items()[0].textContent).toContain(t("rejectedNote"));
  });

  it("shows the Badge line on an approved Assessment, dated in Nairobi time (US-5.4)", async () => {
    // 22:30 UTC on 26 Sept is 01:30 on 27 Sept in Nairobi.
    live.reset([row({ status: "approved", decidedAt: Date.UTC(2026, 8, 26, 22, 30) })]);
    await render();
    const badge = items()[0].querySelector('[data-testid="badge-line"]');
    expect(badge?.textContent).toBe("Verified by Smart Fundis — Electrical: Install a 13A socket · Sep 27, 2026");
    expect(badge?.textContent).toBe(
      t("badgeLine", { trade: "Electrical", task: "Install a 13A socket", date: "Sep 27, 2026" }),
    );
  });

  it("shows no Badge line on an approved row without a decision date, or on any other status", async () => {
    live.reset([
      row({ _id: "a1", status: "approved" }),
      row({ _id: "a2", status: "rejected", decidedAt: Date.UTC(2026, 8, 26) }),
      row({ _id: "a3", status: "awaiting_review" }),
    ]);
    await render();
    expect(container.querySelectorAll('[data-testid="badge-line"]')).toHaveLength(0);
  });

  it("shows the Expert's note on a rejection or an Expert's reshoot, and nothing about who decided", async () => {
    live.reset([
      row({ _id: "a1", status: "rejected", expertNote: "The breaker is never shown off.", decidedAt: Date.UTC(2026, 8, 26) }),
      row({ _id: "a2", status: "reshoot", expertNote: "Film the tester on each wire.", decidedAt: Date.UTC(2026, 8, 26) }),
    ]);
    await render();
    const [rejected, reshoot] = items();
    expect(rejected.textContent).toContain(t("rejectedNote"));
    expect(rejected.querySelector('[data-testid="expert-note"]')?.textContent).toContain("The breaker is never shown off.");
    expect(rejected.textContent).toContain(t("expertNoteLabel"));
    expect(reshoot.textContent).toContain(t("reshootByExpert"));
    expect(reshoot.querySelector('[data-testid="expert-note"]')?.textContent).toContain("Film the tester on each wire.");
    expect(container.textContent).not.toMatch(/users_|deciderUserId/);
  });

  it("changes the chip without a refresh when the status changes", async () => {
    live.reset([row({ status: "queued" })]);
    await render();
    const chip = container.querySelector('[data-testid="status-chip"]');
    expect(chip?.textContent).toBe(t("status.queued"));

    await act(async () => live.push([row({ status: "analyzing" })]));
    expect(chips()).toEqual([t("status.analyzing")]);
    await act(async () => live.push([row({ status: "awaiting_review" })]));
    expect(chips()).toEqual([t("status.awaiting_review")]);

    // The same element was updated in place: no remount, no reload.
    expect(container.querySelector('[data-testid="status-chip"]')).toBe(chip);
    expect(live.mounts).toBe(1);
    // Screen readers hear the change.
    expect(container.querySelector("ul")?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders only copy from messages/en.json", async () => {
    live.reset([row({ status: "reshoot", reshootReason: { code: "too_short", en: "e", sw: "s" } }), row({ _id: "b", status: "queued" })]);
    await render();
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    for (const s of texts) expect(isCopy(s), `hardcoded string: "${s}"`).toBe(true);
  });
});
