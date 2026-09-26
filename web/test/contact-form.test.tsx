// @vitest-environment jsdom
import { ConvexError } from "convex/values";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Contact" });

const convex = vi.hoisted(() => ({
  send: vi.fn<(args: object) => Promise<{ ok: true }>>(),
  useMutation: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: (ref: unknown) => {
    convex.useMutation(ref);
    return convex.send;
  },
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  convex.send.mockReset();
  convex.send.mockResolvedValue({ ok: true });
  convex.useMutation.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render({ convexAvailable = true } = {}) {
  const { ContactForm } = await import("@/components/contact-form");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ConvexAvailableContext value={convexAvailable}>
          <ContactForm to="info@smartfundis.com" />
        </ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

function field(name: string) {
  const el = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  if (!el) throw new Error(`no field ${name}`);
  return el;
}

function labelOf(el: Element) {
  return container.querySelector(`label[for="${el.id}"]`)?.textContent?.trim();
}

function fill(values: Partial<Record<"name" | "contact" | "topic" | "message" | "website", string>>) {
  for (const [name, value] of Object.entries(values)) field(name).value = value;
}

function pickRole(role: "client" | "fundi" | "other") {
  container.querySelector<HTMLInputElement>(`input[name="role"][value="${role}"]`)!.click();
}

async function submit() {
  await act(async () => {
    container.querySelector("form")!.requestSubmit();
  });
}

function fillValid() {
  pickRole("fundi");
  fill({
    name: "  Wanjiru Kamau ",
    contact: "0712 345 678",
    topic: "My badge",
    message: "How long does a review take after I upload?",
  });
}

describe("contact form (Convex)", () => {
  it("labels every field, with 48 px inputs", async () => {
    await render();
    for (const name of ["name", "contact", "topic", "message"]) {
      const el = field(name);
      expect(labelOf(el), name).toBe(t(`form.${name}` as never));
      expect(el.className, name).toMatch(/min-h-12/);
    }
  });

  it("offers the role picker: I'm a client, I'm a fundi, Other", async () => {
    await render();
    const radios = [...container.querySelectorAll<HTMLInputElement>('input[name="role"]')];
    expect(radios.map((r) => r.value)).toEqual(["client", "fundi", "other"]);
    expect(radios.map((r) => labelOf(r))).toEqual([
      t("form.roles.client"),
      t("form.roles.fundi"),
      t("form.roles.other"),
    ]);
    expect(container.querySelector("fieldset legend")?.textContent).toBe(t("form.roleLegend"));
  });

  it("hides the honeypot from people and from the keyboard", async () => {
    await render();
    const honeypot = field("website");
    expect(honeypot.tabIndex).toBe(-1);
    expect(honeypot.getAttribute("autocomplete")).toBe("off");
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("shows inline errors and sends nothing when the form is empty", async () => {
    await render();
    await submit();

    expect(convex.send).not.toHaveBeenCalled();
    const text = container.textContent ?? "";
    for (const key of ["nameRequired", "contactRequired", "roleInvalid", "topicRequired", "messageRequired"]) {
      expect(text, key).toContain(t(`form.errors.${key}` as never));
    }
    const name = field("name");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const describedBy = name.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toBe(t("form.errors.nameRequired"));
  });

  it("rejects a contact that is neither an email nor a Kenyan phone", async () => {
    await render();
    fillValid();
    fill({ contact: "+447700900123" });
    await submit();

    expect(convex.send).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("form.errors.contactInvalid"));
  });

  it("rejects a message under 10 characters", async () => {
    await render();
    fillValid();
    fill({ message: "Too short" });
    await submit();
    expect(convex.send).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("form.errors.messageTooShort"));
  });

  it("sends a valid message to contact.send and confirms without promising a reply time", async () => {
    await render();
    fillValid();
    await submit();

    expect(convex.send).toHaveBeenCalledTimes(1);
    expect(convex.send).toHaveBeenCalledWith({
      name: "Wanjiru Kamau",
      contact: "0712 345 678",
      role: "fundi",
      topic: "My badge",
      message: "How long does a review take after I upload?",
      website: "",
    });
    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toContain("Message received. We reply by email or phone.");
    expect(container.textContent).not.toMatch(/\d+\s*(hours?|days?|minutes?|hrs?)|within|24\/7|online now/i);
  });

  it("passes a filled honeypot through, so the server drops it silently", async () => {
    await render();
    fillValid();
    fill({ website: "http://spam.example" });
    await submit();
    expect(convex.send).toHaveBeenCalledWith(expect.objectContaining({ website: "http://spam.example" }));
  });

  it("explains the throttle when the server says too many", async () => {
    convex.send.mockRejectedValueOnce(new ConvexError({ code: "throttled", message: "x" }));
    await render();
    fillValid();
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(t("form.errors.throttled"));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("offers the email alternative when sending fails", async () => {
    convex.send.mockRejectedValueOnce(new Error("network"));
    await render();
    fillValid();
    await submit();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      t("form.errors.failed", { email: "info@smartfundis.com" }),
    );
  });

  it("uses only copy from en.json for its labels and buttons", async () => {
    await render();
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe(t("form.send"));
  });
});

describe("contact form without Convex (no NEXT_PUBLIC_CONVEX_URL)", () => {
  it("falls back to the mailto form and never calls useMutation", async () => {
    await render({ convexAvailable: false });
    expect(convex.useMutation).not.toHaveBeenCalled();
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe(t("message.send"));
    expect(container.querySelector('input[name="website"]')).toBeNull();
  });
});
