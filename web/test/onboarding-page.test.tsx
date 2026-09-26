import { createTranslator, NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const clerk = vi.hoisted(() => ({ protect: vi.fn(async () => ({ userId: "user_123" })) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: Object.assign(vi.fn(), { protect: clerk.protect }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Onboarding" });

beforeEach(() => clerk.protect.mockClear());

async function render() {
  const page = await import("@/app/(site)/onboarding/page");
  const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {await page.default()}
    </NextIntlClientProvider>,
  );
  return { page, markup };
}

describe("/onboarding page", () => {
  it("protects itself on the server, not only in the proxy", async () => {
    await render();
    expect(clerk.protect).toHaveBeenCalledTimes(1);
  });

  it("has one h1 and the intro from en.json", async () => {
    const { markup } = await render();
    expect(markup.match(/<h1[^>]*>([^<]*)<\/h1>/g)).toEqual([expect.stringContaining(t("title"))]);
    expect(markup).toContain(t("body"));
  });

  it("sets its title from en.json", async () => {
    const { page } = await render();
    expect(await page.generateMetadata()).toEqual({ title: t("meta.title") });
  });
});
