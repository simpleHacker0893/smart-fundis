// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "ReviewDetail" });
const tp = createTranslator({ locale: defaultLocale, messages: en, namespace: "ExpertPage" });

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
  me: undefined as unknown,
  detail: undefined as unknown,
  calls: [] as { name: string; args: unknown }[],
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(vi.fn(), { protect: state.protect }) }));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      state.calls.push({ name, args });
      if (args === "skip") return undefined;
      if (name === "users:me") return state.me;
      if (name === "reviews:detail") return state.detail;
      return undefined;
    },
    useMutation: () => vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace, push: state.push }),
}));

const USER = { _id: "users_1", email: "e@example.com" };
const EXPERT = { user: USER, roles: { base: "none", expert: true, admin: false } };
const VIDEO = "https://example.convex.cloud/api/storage/abc?signed=1";

const detail = (over: object = {}) => ({
  _id: "assessments_1",
  _creationTime: Date.UTC(2026, 8, 20, 9, 30),
  status: "awaiting_review",
  tradeSlug: "electrical",
  tradeName: "Electrical",
  taskSlug: "13a-socket",
  taskName: "Install a 13A socket",
  rubricItems: [
    { id: "isolate", text: "stored isolate text", safety: true },
    { id: "faceplate", text: "stored faceplate text", safety: false },
    { id: "new_item", text: "A brand-new item only in Convex", safety: false },
  ],
  livenessCode: "4821",
  livenessRead: "4821",
  livenessCheck: "yes",
  observations: [
    { itemId: "isolate", result: "no", evidence: "No breaker is shown before the wires.", timestampS: 12.4 },
    { itemId: "faceplate", result: "yes", evidence: "The faceplate is level.", timestampS: 75 },
    { itemId: "new_item", result: "unclear", evidence: "Out of frame.", timestampS: 3 },
  ],
  verdict: "needs_review",
  confidence: 0.73,
  strengths: ["Neat terminations"],
  gaps: ["Isolation not shown"],
  safetyFlags: ["isolate"],
  feedbackEn: "Show the breaker off before touching wires.",
  videoUrl: VIDEO,
  ...over,
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.protect.mockClear();
  state.me = EXPERT;
  state.detail = undefined;
  state.calls = [];
  state.replace.mockReset();
  state.push.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render(assessmentId = "assessments_1") {
  const { default: ReviewPage } = await import("@/app/(site)/expert/[assessmentId]/page");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  const page = await ReviewPage({ params: Promise.resolve({ assessmentId }) });
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <ConvexAvailableContext value={true}>{page}</ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

const text = () => container.textContent ?? "";
const items = () => [...container.querySelectorAll('[data-testid="rubric-item"]')];
const backLink = () => container.querySelector<HTMLAnchorElement>('a[href="/expert"]');

describe("/expert/[assessmentId] guard", () => {
  it("protects itself on the server and has a page title", async () => {
    await render();
    expect(state.protect).toHaveBeenCalledTimes(1);
    const { generateMetadata } = await import("@/app/(site)/expert/[assessmentId]/page");
    expect((await generateMetadata()).title).toBe(t("meta.title"));
  });

  it("sends a non-Expert back to /dashboard and never reads the detail", async () => {
    state.me = { user: USER, roles: { base: "fundi", expert: false, admin: false } };
    state.detail = detail();
    await render();
    expect(state.replace).toHaveBeenCalledWith("/dashboard");
    expect(container.querySelector("video")).toBeNull();
    expect(state.calls.filter((c) => c.name === "reviews:detail" && c.args !== "skip")).toEqual([]);
  });

  it("reads reviews.detail for the Assessment in the URL, with a skeleton while it loads", async () => {
    await render("assessments_42");
    expect(state.calls).toContainEqual({ name: "reviews:detail", args: { assessmentId: "assessments_42" } });
    expect(container.querySelector('[role="status"]')?.textContent).toBe(t("loading"));
  });
});

describe("the review detail (US-5.2)", () => {
  it("says the Assessment is not available, with a way back, when detail is null", async () => {
    state.detail = null;
    await render();
    expect(text()).toContain(t("notAvailable"));
    expect(backLink()?.textContent).toBe(t("backToQueue"));
    expect(container.querySelector("form")).toBeNull();
  });

  it("shows the Trade and Task, and the video the Expert can play inline", async () => {
    state.detail = detail();
    await render();
    expect(container.querySelector("h2")?.textContent).toBe(
      `${en.TradeCatalogue.electrical.name}: ${en.Rubrics["13a-socket"].name}`,
    );
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe(VIDEO);
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(video?.hasAttribute("playsinline")).toBe(true);
    expect(video?.getAttribute("preload")).toBe("metadata");
    expect(backLink()?.textContent).toBe(t("backToQueue"));
    expect(tp("title")).toBe(container.querySelector("h1")?.textContent);
  });

  it("says the video is gone when there is no video URL", async () => {
    state.detail = detail({ videoUrl: null, videoDeletedAt: Date.UTC(2026, 8, 21) });
    await render();
    expect(container.querySelector("video")).toBeNull();
    expect(text()).toContain(t("videoDeleted"));
  });

  it("shows the Liveness code the Fundi was shown next to what the AI read and its check", async () => {
    state.detail = detail({ livenessRead: "4827", livenessCheck: "unclear" });
    await render();
    const liveness = container.querySelector('[data-testid="liveness"]')?.textContent ?? "";
    expect(liveness).toContain("4821");
    expect(liveness).toContain("4827");
    expect(liveness).toContain(t("liveness.check.unclear"));
  });

  it("says when the AI read no Liveness code", async () => {
    state.detail = detail({ livenessRead: undefined, livenessCheck: undefined });
    await render();
    const liveness = container.querySelector('[data-testid="liveness"]')?.textContent ?? "";
    expect(liveness).toContain(t("liveness.notRead"));
    expect(liveness).toContain(t("liveness.check.none"));
  });

  it("lists each Rubric item with its Observation, safety items and AI flags marked", async () => {
    state.detail = detail();
    await render();
    const [isolate, faceplate, fresh] = items();
    // Translated by id where en.json has the item; else the stored English.
    expect(isolate.textContent).toContain(en.Rubrics["13a-socket"].items.isolate);
    expect(isolate.textContent).not.toContain("stored isolate text");
    expect(fresh.textContent).toContain("A brand-new item only in Convex");
    expect(isolate.textContent).toContain(t("safetyItem"));
    expect(isolate.textContent).toContain(t("flagged"));
    expect(faceplate.textContent).not.toContain(t("safetyItem"));
    expect(faceplate.textContent).not.toContain(t("flagged"));
    expect(isolate.textContent).toContain(t("result.no"));
    expect(faceplate.textContent).toContain(t("result.yes"));
    expect(fresh.textContent).toContain(t("result.unclear"));
    expect(isolate.textContent).toContain("No breaker is shown before the wires.");
    expect(isolate.textContent).toContain(t("at", { time: "0:12" }));
    expect(faceplate.textContent).toContain(t("at", { time: "1:15" }));
  });

  it("says when an item has no Observation", async () => {
    state.detail = detail({ observations: [] });
    await render();
    expect(items()[0].textContent).toContain(t("result.none"));
  });

  it("labels the AI result a suggestion for the Expert to decide, and never shows the confidence", async () => {
    state.detail = detail({ confidence: 0.73 });
    await render();
    const ai = container.querySelector('[data-testid="ai-suggestion"]');
    expect(ai?.querySelector("h3")?.textContent).toBe(t("ai.title"));
    expect(t("ai.title")).toBe("AI suggestion — you decide");
    expect(ai?.textContent).toContain(t("ai.verdict", { verdict: en.ReviewQueue.verdict.needs_review }));
    expect(ai?.textContent).toContain("Neat terminations");
    expect(ai?.textContent).toContain("Isolation not shown");
    expect(ai?.textContent).toContain("Show the breaker off before touching wires.");
    expect(ai?.textContent).not.toContain(t("ai.fallback"));
    for (const shown of ["0.73", "73", "73%"]) expect(text()).not.toContain(shown);
    expect(text().toLowerCase()).not.toContain("confidence");
  });

  it("notes when the backup model checked the video", async () => {
    state.detail = detail({ fallbackModel: true });
    await render();
    expect(container.querySelector('[data-testid="ai-suggestion"]')?.textContent).toContain(t("ai.fallback"));
  });

  it("offers the decision form only while the Assessment awaits review", async () => {
    state.detail = detail();
    await render();
    expect(container.querySelector("form")).not.toBeNull();

    state.detail = detail({ status: "approved", videoUrl: null });
    await render();
    expect(container.querySelector("form")).toBeNull();
    expect(text()).toContain(t("decided"));
    expect(text()).not.toContain(t("videoDeleted"));
    expect(text()).toContain(t("videoClosed"));
  });

  it("renders only copy from messages/en.json apart from the AI's own text", async () => {
    state.detail = detail({ fallbackModel: true });
    await render();
    const d = detail();
    const data = new Set([
      ...d.strengths,
      ...d.gaps,
      d.feedbackEn,
      "A brand-new item only in Convex",
      ...d.observations.map((o) => o.evidence),
    ]);
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    for (const s of texts) expect(isCopy(s) || data.has(s), `hardcoded string: "${s}"`).toBe(true);
  });
});

describe("/expert/[assessmentId] error boundary", () => {
  it("shows the not-available message and the way back when the query throws (a malformed id)", async () => {
    const { default: ReviewError } = await import("@/app/(site)/expert/[assessmentId]/error");
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale={defaultLocale} messages={en}>
          <ReviewError error={new Error("ArgumentValidationError")} retry={() => {}} />
        </NextIntlClientProvider>,
      );
    });
    expect(text()).toContain(t("notAvailable"));
    expect(text()).not.toContain("ArgumentValidationError");
    expect(backLink()?.textContent).toBe(t("backToQueue"));
  });
});
