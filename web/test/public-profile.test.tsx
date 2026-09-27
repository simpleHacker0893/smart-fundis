// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "PublicProfile" });

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const NOT_FOUND = "NEXT_HTTP_ERROR_FALLBACK;404";

const state = vi.hoisted(() => ({
  // What getPublic returns for the id in the URL; the client hook returns `live` once set.
  profile: undefined as unknown,
  live: undefined as unknown,
  preloads: [] as { name: string; args: unknown }[],
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

vi.mock("convex/nextjs", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    preloadQuery: async (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      state.preloads.push({ name: getFunctionName(ref), args });
      return { __preloaded: true };
    },
    preloadedQueryResult: () => state.profile,
  };
});

vi.mock("convex/react", () => ({
  usePreloadedQuery: () => (state.live === undefined ? state.profile : state.live),
}));

vi.mock("next/navigation", () => ({ notFound: state.notFound }));

const electrical = en.TradeCatalogue.electrical.name;
const socket = en.Rubrics["13a-socket"].name;

// 22:30 UTC on 26 Sep is 01:30 on 27 Sep in Nairobi (UTC+3).
const DECIDED = Date.UTC(2026, 8, 26, 22, 30);

const profile = (over: object = {}) => ({
  id: "fundiProfiles_1",
  name: "Wanjiru Kamau",
  county: "Nairobi",
  isDemo: false,
  trades: [
    { slug: "electrical", name: "Stored Electrical" },
    { slug: "brand-new-trade", name: "A Trade only in Convex" },
  ],
  badges: [
    { tradeSlug: "electrical", tradeName: "Electrical", taskSlug: "13a-socket", taskName: "Install a 13A socket", decidedAt: DECIDED },
  ],
  ...over,
});

let container: HTMLDivElement;
let root: Root;
const ORIGINAL_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  state.profile = undefined;
  state.live = undefined;
  state.preloads = [];
  state.notFound.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
  else process.env.NEXT_PUBLIC_CONVEX_URL = ORIGINAL_URL;
});

async function render(id = "fundiProfiles_1") {
  const { default: PublicProfilePage } = await import("@/app/(site)/f/[id]/page");
  const page = await PublicProfilePage({ params: Promise.resolve({ id }) });
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        {page}
      </NextIntlClientProvider>,
    );
  });
}

const text = () => container.textContent ?? "";
const badgeLines = () => [...container.querySelectorAll('[data-testid="badge-line"]')].map((el) => el.textContent);

describe("/f/[id] loading (#42)", () => {
  it("reads fundiProfiles.getPublic for the id in the URL, with no sign-in", async () => {
    state.profile = profile();
    await render("fundiProfiles_42");
    expect(state.preloads).toEqual([{ name: "fundiProfiles:getPublic", args: { id: "fundiProfiles_42" } }]);
  });

  it("is a 404 when getPublic returns null, including for a malformed id", async () => {
    state.profile = null;
    await expect(render("not-an-id!")).rejects.toThrow(NOT_FOUND);
    expect(state.notFound).toHaveBeenCalledTimes(1);
    expect(state.preloads).toEqual([{ name: "fundiProfiles:getPublic", args: { id: "not-an-id!" } }]);
  });

  it("says profiles are unavailable, and reads nothing, without a Convex URL", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    await render();
    expect(text()).toBe(t("unavailable"));
    expect(state.preloads).toEqual([]);
  });

  it("has a page title", async () => {
    const { generateMetadata } = await import("@/app/(site)/f/[id]/page");
    expect((await generateMetadata()).title).toBe(t("meta.title"));
  });

  it("says the profile is gone if it stops being public while open", async () => {
    state.profile = profile();
    state.live = null;
    await render();
    expect(text()).toBe(t("notAvailable"));
  });
});

describe("/f/[id] content (US-5.7)", () => {
  it("shows the name, the county and the declared Trades by their en.json names", async () => {
    state.profile = profile();
    await render();
    expect(container.querySelector("h1")?.textContent).toBe("Wanjiru Kamau");
    expect(container.querySelector('[data-testid="county"]')?.textContent).toContain("Nairobi");
    const trades = [...container.querySelectorAll('[data-testid="trade"]')].map((el) => el.textContent);
    // A slug with no message falls back to the server's name.
    expect(trades).toEqual([electrical, "A Trade only in Convex"]);
  });

  it("shows each Badge as the exact 'Verified by Smart Fundis' line with the Nairobi decision date", async () => {
    state.profile = profile({
      badges: [
        { tradeSlug: "electrical", tradeName: "x", taskSlug: "13a-socket", taskName: "y", decidedAt: DECIDED },
        { tradeSlug: "new", tradeName: "Stored Trade", taskSlug: "new-task", taskName: "Stored Task", decidedAt: Date.UTC(2026, 8, 1, 9) },
      ],
    });
    await render();
    expect(badgeLines()).toEqual([
      `Verified by Smart Fundis — ${electrical}: ${socket} · Sep 27, 2026`,
      "Verified by Smart Fundis — Stored Trade: Stored Task · Sep 1, 2026",
    ]);
    expect(container.querySelector('[data-testid="not-yet-verified"]')).toBeNull();
  });

  it("says 'Not yet verified' in dim text, with no amber and no warning glyph, when there is no Badge", async () => {
    state.profile = profile({ badges: [] });
    await render();
    expect(badgeLines()).toEqual([]);
    const line = container.querySelector('[data-testid="not-yet-verified"]');
    expect(line?.textContent).toBe("Not yet verified");
    expect(line?.className).toContain("text-foreground/");
    expect(line?.className).not.toMatch(/primary|amber|warn|destructive/);
    expect(line?.querySelector("svg")).toBeNull();
  });

  it("tags a Demo profile and each of its Badges 'Demo: not a real verification'", async () => {
    state.profile = profile({ isDemo: true });
    await render();
    expect(container.querySelector('[data-testid="demo-tag"]')?.textContent).toBe("Demo: not a real verification");
    expect(container.querySelector('[data-testid="badge"]')?.textContent).toContain("Demo: not a real verification");
  });

  it("shows no Demo tag on a real profile", async () => {
    state.profile = profile();
    await render();
    expect(text()).not.toContain(t("demoTag"));
  });

  it("never says certified, and shows no phone, video or AI output even if the query sent them", async () => {
    state.profile = profile({
      phone: "0712 345 678",
      videoUrl: "https://example.convex.cloud/api/storage/abc",
      verdict: "pass",
      feedbackEn: "Stub result: no AI ran.",
    });
    await render();
    expect(text()).not.toMatch(/certif/i);
    for (const leaked of ["0712", "storage", "pass", "Stub result"]) expect(text()).not.toContain(leaked);
    expect(container.querySelector("video, iframe, a[href^='tel:']")).toBeNull();
  });
});

describe("/f/[id] 404 page", () => {
  it("says there is no profile, never why, and links home", async () => {
    const { default: NotFound } = await import("@/app/(site)/f/[id]/not-found");
    const page = await NotFound();
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
          {page}
        </NextIntlClientProvider>,
      );
    });
    expect(container.querySelector("h1")?.textContent).toBe(t("notFound.title"));
    expect(text()).toContain(t("notFound.body"));
    expect(container.querySelector('a[href="/"]')?.textContent).toBe(t("notFound.home"));
  });
});
