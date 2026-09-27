// @vitest-environment jsdom
import { ConvexError } from "convex/values";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "DecisionForm" });

const state = vi.hoisted(() => ({
  decide: vi.fn(async (_args: unknown): Promise<null> => null),
  mutationName: "",
  push: vi.fn(),
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  return {
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
      state.mutationName = getFunctionName(ref);
      return state.decide;
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: state.push }),
}));

const ID = "assessments_1";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.decide.mockReset();
  state.decide.mockResolvedValue(null);
  state.push.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render() {
  const { DecisionForm } = await import("@/app/(site)/expert/[assessmentId]/decision-form");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <DecisionForm assessmentId={ID as never} />
      </NextIntlClientProvider>,
    );
  });
}

const radio = (value: string) => container.querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`)!;
const note = () => container.querySelector("textarea")!;
const alert = () => container.querySelector('[role="alert"]')?.textContent ?? null;
const submitButton = () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!;

async function choose(value: string) {
  await act(async () => radio(value).click());
}

async function type(value: string) {
  const el = note();
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(el, value);
  await act(async () => el.dispatchEvent(new Event("input", { bubbles: true })));
}

async function submit() {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

describe("the decision form (US-5.3)", () => {
  it("offers approve, reshoot and reject as labelled choices, and a labelled note", async () => {
    await render();
    const labels = [...container.querySelectorAll('input[type="radio"]')].map(
      (input) => container.querySelector(`label[for="${input.id}"]`)?.textContent ?? input.closest("label")?.textContent,
    );
    expect(labels).toEqual([t("choice.approve"), t("choice.reshoot"), t("choice.reject")]);
    expect(container.querySelector("legend")?.textContent).toBe(t("title"));
    const textarea = note();
    expect(container.querySelector(`label[for="${textarea.id}"]`)?.textContent).toBe(t("noteLabel"));
    expect(textarea.maxLength).toBe(1000);
    expect(submitButton().textContent).toBe(t("submit"));
  });

  // Defence in depth: submit is disabled until a choice is made, so a user
  // can't reach this path; a synthetic submit event still must not send.
  it("still refuses to send without a choice if the form is submitted anyway", async () => {
    await render();
    await submit();
    expect(alert()).toBe(t("choiceRequired"));
    expect(state.decide).not.toHaveBeenCalled();
  });

  it("has no decision pre-selected, and keeps submit disabled until one is chosen", async () => {
    await render();
    expect([...container.querySelectorAll('input[type="radio"]')].some((r) => (r as HTMLInputElement).checked)).toBe(
      false,
    );
    expect(submitButton().disabled).toBe(true);
    await choose("approve");
    expect(submitButton().disabled).toBe(false);
  });

  it("requires a note for a reshoot or a rejection, and says so under the note", async () => {
    await render();
    await choose("reshoot");
    expect(container.textContent).toContain(t("noteHintRequired", { max: 1000 }));
    expect(note().required).toBe(true);
    await submit();
    expect(alert()).toBe(t("errors.note_required"));
    expect(note().getAttribute("aria-invalid")).toBe("true");
    expect(state.decide).not.toHaveBeenCalled();

    await choose("reject");
    await type("   ");
    await submit();
    expect(alert()).toBe(t("errors.note_required"));
    expect(state.decide).not.toHaveBeenCalled();
  });

  it("makes the note optional for an approval, and makes clear it is not shown to the Fundi", async () => {
    await render();
    await choose("approve");
    const textarea = note();
    expect(container.querySelector(`label[for="${textarea.id}"]`)?.textContent).toBe(t("noteLabelApprove"));
    expect(container.textContent).toContain(t("noteHintApprove", { max: 1000 }));
    expect(textarea.required).toBe(false);
  });

  it("keeps 'Note to the Fundi' as the label for a reshoot or a rejection", async () => {
    await render();
    await choose("reshoot");
    const textarea = note();
    expect(container.querySelector(`label[for="${textarea.id}"]`)?.textContent).toBe(t("noteLabel"));
  });

  it("refuses a note over 1000 characters without calling the server", async () => {
    await render();
    await choose("reject");
    await type("x".repeat(1001));
    await submit();
    expect(alert()).toBe(t("errors.note_too_long", { max: 1000 }));
    expect(alert()).toContain("1000");
    expect(state.decide).not.toHaveBeenCalled();
  });

  it("links the note to its error with aria-describedby (DESIGN D9)", async () => {
    await render();
    await choose("reject");
    await submit();
    const error = container.querySelector('[role="alert"]')!;
    expect(error.id).not.toBe("");
    expect(note().getAttribute("aria-invalid")).toBe("true");
    expect(note().getAttribute("aria-describedby")?.split(" ")).toContain(error.id);
  });

  it("approves with no note, then goes back to the queue", async () => {
    await render();
    await choose("approve");
    await submit();
    expect(state.mutationName).toBe("reviews:decide");
    expect(state.decide).toHaveBeenCalledWith({ assessmentId: ID, decision: "approve" });
    expect(state.push).toHaveBeenCalledWith("/expert");
    expect(alert()).toBeNull();
  });

  it("rejects with the trimmed note", async () => {
    await render();
    await choose("reject");
    await type("  The breaker is never shown off.  ");
    await submit();
    expect(state.decide).toHaveBeenCalledWith({
      assessmentId: ID,
      decision: "reject",
      note: "The breaker is never shown off.",
    });
    expect(state.push).toHaveBeenCalledWith("/expert");
  });

  it("requests a reshoot with the note", async () => {
    await render();
    await choose("reshoot");
    await type("Film the tester on each wire.");
    await submit();
    expect(state.decide).toHaveBeenCalledWith({ assessmentId: ID, decision: "reshoot", note: "Film the tester on each wire." });
  });

  it("disables the button while sending, so one decision is sent once", async () => {
    let finish: (v: null) => void = () => {};
    state.decide.mockImplementation(() => new Promise<null>((resolve) => (finish = resolve)));
    await render();
    await choose("approve");
    await submit();
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toBe(t("submitting"));
    await submit();
    expect(state.decide).toHaveBeenCalledTimes(1);
    await act(async () => finish(null));
    expect(state.push).toHaveBeenCalledWith("/expert");
  });

  it.each(["forbidden", "invalid_status", "note_required", "note_too_long"] as const)(
    "shows the %s message from the server and stays on the page",
    async (code) => {
      state.decide.mockRejectedValue(new ConvexError({ code, message: "server text" }));
      await render();
      await choose("reject");
      await type("A note.");
      await submit();
      expect(alert()).toBe(t(`errors.${code}`, { max: 1000 }));
      expect(container.textContent).not.toContain("server text");
      expect(state.push).not.toHaveBeenCalled();
      expect(submitButton().disabled).toBe(false);
    },
  );

  it("shows a retry message for any other failure", async () => {
    state.decide.mockRejectedValue(new Error("offline"));
    await render();
    await choose("approve");
    await submit();
    expect(alert()).toBe(t("errors.unexpected"));
    expect(state.push).not.toHaveBeenCalled();
  });

  it("renders only copy from messages/en.json", async () => {
    await render();
    await choose("reject");
    await submit();
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean);
    expect(texts.length).toBeGreaterThan(0);
    for (const s of texts) expect(isCopy(s), `hardcoded string: "${s}"`).toBe(true);
  });
});
