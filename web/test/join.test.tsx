import { createTranslator, NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages, visibleStrings } from "./copy-helpers";

// /join?role= (#27): fundis are sent to Clerk's sign-up with the role kept;
// Expert applications aren't built yet (V4), so role=expert says so.

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

// Next's redirect() throws to stop rendering; the mock records the URL and does the same.
const next = vi.hoisted(() => ({ calls: [] as string[] }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    next.calls.push(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "Join" });
const common = createTranslator({ locale: defaultLocale, messages: en, namespace: "Common" });

const isFromMessages = makeIsFromMessages(en);

async function visit(role?: string, trade?: string) {
  const { default: JoinPage } = await import("@/app/(site)/join/page");
  const page = await JoinPage({
    searchParams: Promise.resolve({ ...(role === undefined ? {} : { role }), ...(trade === undefined ? {} : { trade }) }),
  });
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={defaultLocale} messages={en}>
      {page}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  next.calls = [];
});

describe("/join (#27)", () => {
  it.each([["fundi"], [undefined], ["client"], ["<script>"]])(
    "sends role=%s to /sign-up, keeping a known role",
    async (role) => {
      await expect(visit(role)).rejects.toThrow("NEXT_REDIRECT");
      expect(next.calls).toEqual(["/sign-up?role=fundi"]);
    },
  );

  it("carries an open trade through to sign-up, and drops an unknown one (#14 review)", async () => {
    await expect(visit("fundi", "electrical")).rejects.toThrow("NEXT_REDIRECT");
    await expect(visit("fundi", "plumbing")).rejects.toThrow("NEXT_REDIRECT");
    await expect(visit("fundi", "<script>")).rejects.toThrow("NEXT_REDIRECT");
    expect(next.calls).toEqual(["/sign-up?role=fundi&trade=electrical", "/sign-up?role=fundi", "/sign-up?role=fundi"]);
  });

  it("shows 'Coming soon' for Experts instead of a sign-up that doesn't exist", async () => {
    const markup = await visit("expert");
    expect(next.calls).toEqual([]);
    const strings = visibleStrings(markup);
    for (const s of strings) expect(isFromMessages(s), `hardcoded: "${s}"`).toBe(true);
    expect(strings).toContain(t("expert.title"));
    expect(strings).toContain(common("comingSoon"));
    expect(markup).not.toMatch(/<form|<button|<input/);
    expect([...markup.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1])).toEqual(["/evidence", "/"]);
  });

  it("takes its title from en.json", async () => {
    const { generateMetadata } = await import("@/app/(site)/join/page");
    expect((await generateMetadata()).title).toBe(t("meta.title"));
  });
});
