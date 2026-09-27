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
  const { default: ReviewPage } = await import("@/app/(app)/expert/[assessmentId]/page");
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
const backLink = () => container.querySelector<HTMLAnchorElement>('a[href="/expert"]');

describe("/expert/[assessmentId] guard", () => {
  it("protects itself on the server and has a page title", async () => {
    await render();
    expect(state.protect).toHaveBeenCalledTimes(1);
    const { generateMetadata } = await import("@/app/(app)/expert/[assessmentId]/page");
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

describe("the review detail (US-5.2, #67 screen 29)", () => {
  const td = createTranslator({ locale: defaultLocale, messages: en, namespace: "DecisionForm" });
  const tq = createTranslator({ locale: defaultLocale, messages: en, namespace: "ReviewQueue" });
  const NOW = Date.UTC(2026, 8, 20, 12, 30);

  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const obs = () => [...container.querySelectorAll('[data-testid="observation"]')];
  const aiPanel = () => container.querySelector('[data-testid="ai-suggestion"]');
  /** Plays the video to its end: the AI suggestion unlocks on the first `ended` (D-51). */
  const watchToEnd = async () => {
    await act(async () => container.querySelector("video")!.dispatchEvent(new Event("ended")));
  };

  it("says the video is not available, with a way back, when detail is null: no player, no AI panel, no form", async () => {
    state.detail = null;
    await render();
    expect(t("notAvailable")).toBe("This video has already been decided or isn't yours to review.");
    expect(text()).toContain(t("notAvailable"));
    expect(backLink()?.textContent).toBe(t("backToQueue"));
    expect(container.querySelector("video")).toBeNull();
    expect(aiPanel()).toBeNull();
    expect(container.querySelector("form")).toBeNull();
  });

  it("titles the page with the Task, the mono Trade and waiting age, and a back link to the queue", async () => {
    state.detail = detail({ _creationTime: NOW - 3 * 3_600_000 });
    await render();
    expect(container.querySelector("h1")?.textContent).toBe(en.Rubrics["13a-socket"].name);
    expect(text()).toContain(
      tq("meta", { trade: en.TradeCatalogue.electrical.name, age: tq("age.hours", { n: 3 }) }),
    );
    expect(backLink()?.textContent).toBe(t("backLink"));
  });

  it("plays the video inline with #41's defence-in-depth attributes", async () => {
    state.detail = detail();
    await render();
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe(VIDEO);
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(video?.hasAttribute("playsinline")).toBe(true);
    expect(video?.getAttribute("preload")).toBe("metadata");
    expect(video?.getAttribute("controlslist")).toBe("nodownload noremoteplayback");
    expect(video?.hasAttribute("disablepictureinpicture")).toBe(true);
    expect(video?.getAttribute("aria-label")).toBe(t("videoLabel"));
  });

  it("says the video is gone when there is no video URL and it has been deleted", async () => {
    state.detail = detail({ videoUrl: null, videoDeletedAt: Date.UTC(2026, 8, 21) });
    await render();
    expect(container.querySelector("video")).toBeNull();
    expect(text()).toContain(t("videoDeleted"));
    // The decision is still available.
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("W5: says the video could not load when it is missing in an open status without videoDeletedAt", async () => {
    for (const status of ["awaiting_review", "appealed"] as const) {
      state.detail = detail({ status, videoUrl: null });
      await render();
      expect(container.querySelector("video")).toBeNull();
      expect(text()).toContain(t("videoUnavailable"));
      expect(text()).not.toContain(t("videoDeleted"));
      expect(text()).not.toContain(t("videoClosed"));
    }
  });

  it("says the video could not load when the player fails, and keeps the decision", async () => {
    state.detail = detail();
    await render();
    await act(async () => container.querySelector("video")!.dispatchEvent(new Event("error")));
    expect(container.querySelector("video")).toBeNull();
    expect(text()).toContain(t("videoUnavailable"));
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("reads out the Liveness code shown, what the AI read and the check, with the mismatch line", async () => {
    state.detail = detail({ livenessRead: "4827", livenessCheck: "unclear" });
    await render();
    const liveness = container.querySelector('[data-testid="liveness"]')?.textContent ?? "";
    expect(liveness).toContain(t("liveness.shown", { code: "4821" }));
    expect(liveness).toContain(t("liveness.read", { code: "4827" }));
    expect(liveness).toContain(t("liveness.check", { result: t("liveness.result.unclear") }));
    expect(liveness).toContain("A mismatch is a reason to look, not to reject.");
  });

  it("says when the AI could not read the Liveness code", async () => {
    state.detail = detail({ livenessRead: undefined, livenessCheck: undefined });
    await render();
    const liveness = container.querySelector('[data-testid="liveness"]')?.textContent ?? "";
    expect(liveness).toContain(t("liveness.notReadable"));
    expect(liveness).toContain(t("liveness.check", { result: t("liveness.result.none") }));
  });

  it("lists Observations safety items first, each with its answer in words, the AI's evidence and a plain timestamp", async () => {
    state.detail = detail({
      rubricItems: [
        { id: "faceplate", text: "stored faceplate text", safety: false },
        { id: "isolate", text: "stored isolate text", safety: true },
        { id: "new_item", text: "A brand-new item only in Convex", safety: false },
      ],
    });
    await render();
    const [isolate, faceplate, fresh] = obs();
    // Safety first; translated by id where en.json has the item, else the stored English.
    expect(isolate.textContent).toContain(en.Rubrics["13a-socket"].items.isolate);
    expect(isolate.textContent).not.toContain("stored isolate text");
    expect(faceplate.textContent).toContain(en.Rubrics["13a-socket"].items.faceplate);
    expect(fresh.textContent).toContain("A brand-new item only in Convex");

    const safetyTag = isolate.querySelector('[data-testid="safety-tag"]');
    expect(safetyTag?.textContent).toBe(t("observations.safety"));
    expect(safetyTag?.className).not.toMatch(/primary/);
    expect(faceplate.querySelector('[data-testid="safety-tag"]')).toBeNull();
    // The AI's own flag stays, neutral.
    expect(isolate.textContent).toContain(t("observations.flagged"));
    expect(isolate.innerHTML).not.toMatch(/primary/);
    expect(faceplate.textContent).not.toContain(t("observations.flagged"));

    expect(isolate.textContent).toContain("AI: no");
    expect(faceplate.textContent).toContain("AI: yes");
    expect(fresh.textContent).toContain("The AI couldn't tell");

    const quote = isolate.querySelector("q");
    expect(quote?.textContent).toBe("No breaker is shown before the wires.");
    expect(isolate.querySelector('[data-testid="ai-tag"]')?.textContent).toBe(t("aiTag"));

    const time = (li: Element) => li.querySelector('[data-testid="timestamp"]');
    expect(time(isolate)?.textContent).toBe("0:12");
    expect(time(faceplate)?.textContent).toBe("1:15");
    expect(time(isolate)?.className).toMatch(/\bmin-h-12\b/);
    // Plain text in V7, not a button.
    expect(isolate.querySelector("button")).toBeNull();
  });

  it("shows '--:--' labelled 'no timestamp' and 'No observation' when an item has none", async () => {
    state.detail = detail({ observations: [] });
    await render();
    const first = obs()[0];
    expect(first.textContent).toContain(t("observations.answer.none"));
    const time = first.querySelector('[data-testid="timestamp"]');
    expect(time?.textContent).toContain("--:--");
    expect(time?.textContent).toContain(t("observations.noTimestamp"));
    expect(first.querySelector("q")).toBeNull();
  });

  it("locks the AI suggestion until the video has played to its end, with a lock icon and no preview (D-51)", async () => {
    state.detail = detail();
    await render();
    const ai = aiPanel()!;
    expect(ai.getAttribute("data-locked")).toBe("true");
    expect(ai.textContent).toContain(t("ai.locked"));
    expect(ai.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    // Nothing of the suggestion is in the DOM, blurred or otherwise.
    for (const hidden of ["Neat terminations", "Isolation not shown", "Show the breaker off before touching wires."]) {
      expect(ai.textContent).not.toContain(hidden);
    }
    expect(ai.textContent).not.toContain(t("ai.verdict", { verdict: t("ai.verdictWord.needs_review") }));
    expect(ai.innerHTML).not.toMatch(/blur/);
    // Observations stay visible (D-51 allows them), and the decision stays usable.
    expect(obs()).toHaveLength(3);
    expect(container.querySelector("form")).not.toBeNull();

    // Pausing or seeking does not unlock it; only reaching the end does.
    await act(async () => container.querySelector("video")!.dispatchEvent(new Event("pause")));
    expect(aiPanel()!.getAttribute("data-locked")).toBe("true");
    await watchToEnd();
    expect(aiPanel()!.getAttribute("data-locked")).toBe("false");
    expect(aiPanel()!.textContent).not.toContain(t("ai.locked"));
    expect(aiPanel()!.textContent).toContain("Neat terminations");
  });

  it("keeps the AI suggestion locked when the video fails to load or is deleted, and the decision usable", async () => {
    state.detail = detail();
    await render();
    await act(async () => container.querySelector("video")!.dispatchEvent(new Event("error")));
    expect(aiPanel()!.getAttribute("data-locked")).toBe("true");
    expect(aiPanel()!.textContent).toContain(t("ai.locked"));
    expect(container.querySelector<HTMLButtonElement>('form button[type="submit"]')).not.toBeNull();
    expect(container.querySelectorAll('form input[type="radio"]')).toHaveLength(3);

    state.detail = detail({ videoUrl: null, videoDeletedAt: Date.UTC(2026, 8, 21) });
    await render();
    expect(aiPanel()!.getAttribute("data-locked")).toBe("true");
    expect(aiPanel()!.textContent).not.toContain("Neat terminations");
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("labels the AI's feedback as a draft not shown to the Fundi yet", async () => {
    expect(t("ai.feedback")).toBe("Feedback the AI drafted (not shown to the Fundi yet)");
  });

  it("keeps #41's AI panel: outlined, AI-tagged, 'AI suggestion — you decide', the verdict in words, never a confidence", async () => {
    state.detail = { ...detail(), confidence: 0.73 } as ReturnType<typeof detail>;
    await render();
    await watchToEnd();
    const ai = aiPanel()!;
    expect(ai.querySelector("h2")?.textContent).toBe("AI suggestion — you decide");
    expect(ai.querySelector('[data-testid="ai-tag"]')?.textContent).toBe(t("aiTag"));
    expect(ai.className).toMatch(/\bborder\b/);
    expect(ai.innerHTML).not.toMatch(/primary|✓/);
    expect(ai.textContent).toContain(t("ai.verdict", { verdict: t("ai.verdictWord.needs_review") }));
    expect(ai.textContent).toContain("Neat terminations");
    expect(ai.textContent).toContain("Isolation not shown");
    expect(ai.textContent).toContain("Show the breaker off before touching wires.");
    expect(ai.textContent).not.toContain(t("ai.fallback"));
  });

  it("notes when the backup model checked the video", async () => {
    state.detail = detail({ fallbackModel: true });
    await render();
    await watchToEnd();
    expect(aiPanel()?.textContent).toContain(t("ai.fallback"));
  });

  it("puts YOUR DECISION after the AI panel, outside it, with none pre-selected", async () => {
    state.detail = detail();
    await render();
    const ai = aiPanel()!;
    const form = container.querySelector("form")!;
    expect(ai.contains(form)).toBe(false);
    expect(ai.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const radios = [...form.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(radios.map((r) => r.value)).toEqual(["approve", "reshoot", "reject"]);
    expect(radios.some((r) => r.checked)).toBe(false);
    expect(form.querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe(td("submit"));
  });

  it("never shows a percentage, confidence, 'certif…', a named Expert, EPRA/KNOS, urgency or hotkeys", async () => {
    state.detail = { ...detail({ fallbackModel: true }), confidence: 0.73 } as ReturnType<typeof detail>;
    await render();
    await watchToEnd();
    const all = text();
    expect(all).not.toMatch(/%|confiden|certif|EPRA|KNOS|urgen|priority|hotkey|issue verified badge/i);
    for (const shown of ["0.73", "73"]) expect(all).not.toContain(shown);
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

  it("has no amber on the page apart from the one Submit pill", async () => {
    state.detail = detail();
    await render();
    const amber = [...container.querySelectorAll("[class]")].filter((el) =>
      /(^|\s)(bg|text|border)-primary(\s|$)/.test(el.getAttribute("class") ?? ""),
    );
    expect(amber).toHaveLength(1);
    expect(amber[0].getAttribute("type")).toBe("submit");
  });

  it("keeps to the D1 type ladder: no 14 px text", async () => {
    state.detail = detail();
    await render();
    await watchToEnd();
    expect(container.innerHTML).not.toMatch(/\btext-sm\b/);
  });

  it("renders only copy from messages/en.json apart from the AI's own text", async () => {
    state.detail = detail({ fallbackModel: true });
    await render();
    await watchToEnd();
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
    const { default: ReviewError } = await import("@/app/(app)/expert/[assessmentId]/error");
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale={defaultLocale} messages={en}>
          <ReviewError error={new Error("ArgumentValidationError")} retry={() => {}} reset={() => {}} />
        </NextIntlClientProvider>,
      );
    });
    expect(text()).toContain(t("notAvailable"));
    expect(text()).not.toContain("ArgumentValidationError");
    expect(backLink()?.textContent).toBe(t("backToQueue"));
  });
});
