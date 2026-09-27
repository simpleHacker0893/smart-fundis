// @vitest-environment jsdom
import { ConvexError } from "convex/values";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseShowcaseLink } from "@convex/lib/showcaseLinks";
import type { SavedShowcaseLinks, ShowcaseLinksUpdate } from "@/components/showcase-links-editor";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "AddVideo" });
const YOUTUBE = "https://youtu.be/2tdN85reWN0";

function saved(url: string) {
  const parsed = parseShowcaseLink(url);
  if (!parsed.ok) throw new Error(url);
  const { id, url: canonical, embedUrl } = parsed.link;
  return { id, url: canonical, embedUrl };
}

let container: HTMLDivElement;
let root: Root;
let onSave: ReturnType<typeof vi.fn<(update: ShowcaseLinksUpdate) => Promise<unknown>>>;
let online = true;

beforeEach(() => {
  online = true;
  vi.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  onSave = vi.fn(async () => null);
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
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

async function render(links: SavedShowcaseLinks | undefined = { youtube: null, tiktok: null }) {
  const { AddVideoPanel } = await import("@/components/add-video-sheet");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <AddVideoPanel links={links} onSave={onSave} />
      </NextIntlClientProvider>,
    );
  });
}

const input = () => container.querySelector<HTMLInputElement>('input[type="url"]')!;
async function type(value: string) {
  const el = input();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
  await act(async () => el.dispatchEvent(new Event("input", { bubbles: true })));
}
const submit = () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
async function add() {
  await act(async () => submit().click());
}
const alert = () => container.querySelector('[role="alert"]');
const text = () => (container.textContent ?? "").replace(/\s+/g, " ");

describe("the Add video sheet (prompt 26)", () => {
  it("offers Record or upload, then OR, then the Showcase link group, with the exact lines", async () => {
    await render();
    const groups = [...container.querySelectorAll("[data-group]")];
    expect(groups.map((g) => g.getAttribute("data-group"))).toEqual(["record", "link"]);
    const [record, link] = groups;
    expect(record.textContent).toContain("Record or upload");
    expect(record.textContent).toContain("Earns a badge once an Expert approves it.");
    expect(record.textContent).toContain("You'll film one task with a code we give you.");
    expect(record.querySelector("a")?.getAttribute("href")).toBe("/fundi/record");
    expect(record.querySelector("a")?.className).toMatch(/\bmin-h-12\b/);

    const divider = container.querySelector("[data-divider]");
    expect(divider?.textContent).toBe(t("or"));
    const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(record, divider!)).toBe(true);
    expect(follows(divider!, link)).toBe(true);

    expect(link.textContent).toContain("Add a YouTube or TikTok link");
    expect(link.textContent).toContain("Showcase — not verified");
    expect(link.textContent).toContain("Links never earn a badge. They show on your profile as examples of your work.");
    expect(link.textContent).toContain("Only link to videos of your own work.");
    expect(input().placeholder).toBe(t("link.placeholder"));
    expect(submit().textContent).toBe("Add link");
  });

  it("uses no amber fill and no brand logo inside the sheet", async () => {
    await render();
    expect(container.querySelectorAll('[class*="bg-primary"]')).toHaveLength(0);
    expect(container.querySelector("img")).toBeNull();
    expect(submit().className).not.toMatch(/bg-primary/);
  });

  it("refuses a link from another site, keeps the value and ties the ✕ error to the field", async () => {
    await render();
    await type("https://facebook.com/EXAMPLE");
    await add();
    expect(onSave).not.toHaveBeenCalled();
    expect(alert()?.textContent).toBe("Only YouTube or TikTok links can be added.");
    expect(alert()?.closest("p")?.textContent).toBe("✕Only YouTube or TikTok links can be added.");
    expect(input().value).toBe("https://facebook.com/EXAMPLE");
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().getAttribute("aria-describedby")).toContain(alert()!.id);
    // Errors are neutral, never amber.
    expect(alert()?.closest("p")?.className).not.toMatch(/primary/);
  });

  it("says 'one video' for a YouTube or TikTok page that is not a video", async () => {
    await render();
    await type("https://www.youtube.com/@somechannel");
    await add();
    expect(alert()?.textContent).toBe(t("errors.unsupported"));
    await type("https://vm.tiktok.com/ZMabc/");
    await add();
    expect(alert()?.textContent).toBe(t("errors.tiktok_short"));
    await type("");
    await add();
    expect(alert()?.textContent).toBe(t("errors.empty"));
  });

  it("saves a YouTube link into its slot, shows Adding… at the same size, then the confirmation", async () => {
    let finish: () => void = () => {};
    onSave.mockImplementation(() => new Promise((resolve) => (finish = () => resolve(null))));
    await render();
    await type(YOUTUBE);
    const sizeBefore = submit().className;
    await add();
    expect(onSave).toHaveBeenCalledWith({ youtube: "https://www.youtube.com/watch?v=2tdN85reWN0" });
    expect(submit().textContent).toBe("Adding…");
    expect(submit().disabled).toBe(true);
    expect(submit().getAttribute("aria-busy")).toBe("true");
    expect(submit().className).toBe(sizeBefore);
    await act(async () => finish());
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Added to Showcase — not verified.");
    expect(input().value).toBe("");
  });

  it("saves a TikTok link into the TikTok slot", async () => {
    await render();
    await type("https://www.tiktok.com/@fundi.wanjiru/video/7212345678901234567");
    await add();
    expect(onSave).toHaveBeenCalledWith({ tiktok: "https://www.tiktok.com/@fundi.wanjiru/video/7212345678901234567" });
  });

  it("shows the server's field error, or a save error that never blames the user", async () => {
    onSave.mockRejectedValueOnce(new ConvexError({ code: "invalid", fields: { youtube: "unsupported" } }));
    await render();
    await type(YOUTUBE);
    await add();
    expect(alert()?.textContent).toBe(t("errors.unsupported"));
    onSave.mockRejectedValueOnce(new Error("network"));
    await add();
    expect(alert()?.textContent).toBe(t("errors.save"));
    expect(input().value).toBe(YOUTUBE);
  });

  it("lists the saved links under SHOWCASE LINKS", async () => {
    await render({ youtube: saved(YOUTUBE), tiktok: null });
    expect(text()).toContain(t("link.savedTitle"));
    expect(text()).toContain("https://www.youtube.com/watch?v=2tdN85reWN0");
  });

  it("disables Add link offline with 'Needs a connection', and re-enables it when back", async () => {
    online = false;
    await render();
    expect(submit().disabled).toBe(true);
    expect(submit().textContent).toBe("Needs a connection");
    online = true;
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(submit().disabled).toBe(false);
    expect(submit().textContent).toBe("Add link");
  });

  it("renders only copy from messages/en.json", async () => {
    await render({ youtube: saved(YOUTUBE), tiktok: null });
    await type("https://facebook.com/x");
    await add();
    const isCopy = makeIsFromMessages(en);
    const texts = [...container.querySelectorAll("*")]
      .flatMap((el) => [...el.childNodes])
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean)
      .filter((s) => !s.startsWith("https://"));
    for (const s of texts) expect(isCopy(s) || s === "✕", `hardcoded string: "${s}"`).toBe(true);
  });
});

describe("the Add video trigger (shell slot and mobile Home button)", () => {
  it("opens the sheet as an anchored dialog titled Add video", async () => {
    const { AddVideoButton } = await import("@/components/add-video-sheet");
    const { ConvexAvailableContext } = await import("@/components/convex-available");
    await act(async () => {
      root.render(
        <NextIntlClientProvider locale={defaultLocale} messages={en}>
          <ConvexAvailableContext value={false}>
            <AddVideoButton />
          </ConvexAvailableContext>
        </NextIntlClientProvider>,
      );
    });
    const trigger = container.querySelector<HTMLButtonElement>("button[aria-haspopup='dialog']")!;
    expect(trigger.textContent).toBe(en.AppShell.addVideo);
    expect(trigger.className).toMatch(/\bbg-primary\b/);
    const dialog = container.querySelector("dialog")!;
    expect(dialog.getAttribute("aria-label")).toBe(t("title"));
    expect(dialog.hasAttribute("open")).toBe(false);
    await act(async () => trigger.click());
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.textContent).toContain(t("record.title"));
  });
});
