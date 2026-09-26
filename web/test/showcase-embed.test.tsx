// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { parseShowcaseLink, type ShowcaseLink } from "@/lib/showcase-links";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Showcase" });

function link(url: string): ShowcaseLink {
  const parsed = parseShowcaseLink(url);
  if (!parsed.ok) throw new Error(url);
  return parsed.link;
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render(l: ShowcaseLink) {
  const { ShowcaseEmbed } = await import("@/components/showcase-embed");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ShowcaseEmbed link={l} />
      </NextIntlClientProvider>,
    );
  });
}

describe("ShowcaseEmbed (US-3.8, ADR-7)", () => {
  it("embeds the operator's sample YouTube link with youtube-nocookie, labelled 'Showcase — not verified'", async () => {
    await render(link("https://www.youtube.com/watch?v=2tdN85reWN0"));
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/2tdN85reWN0");
    expect(iframe?.getAttribute("title")).toBe(t("youtubeTitle"));
    expect(iframe?.getAttribute("loading")).toBe("lazy");
    expect(iframe?.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
    expect(t("label")).toBe("Showcase — not verified");
    expect(container.textContent).toContain(t("label"));
    expect(container.textContent).not.toMatch(/certif|Verified by Smart Fundis/i);
  });

  it("embeds a TikTok link with the TikTok player", async () => {
    await render(link("https://www.tiktok.com/@fundi/video/7212345678901234567"));
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("https://www.tiktok.com/player/v1/7212345678901234567");
    expect(container.querySelector("iframe")?.getAttribute("title")).toBe(t("tiktokTitle"));
    expect(container.textContent).toContain(t("label"));
  });

  it("keeps the player inside a 360 px screen", async () => {
    await render(link("https://youtu.be/qSHhSnuUcXc"));
    expect(container.querySelector("iframe")?.className).toMatch(/\bw-full\b/);
  });
});
