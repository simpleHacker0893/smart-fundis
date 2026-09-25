import { createTranslator } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { leafStrings, visibleStrings } from "./copy-helpers";

const EMAIL = "wanjiru@example.com";

vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/en.json")).default;
  const { defaultLocale } = await import("@/i18n/config");
  return {
    getTranslations: async (namespace?: string) =>
      createTranslator({ locale: defaultLocale, messages, namespace: namespace as never }),
  };
});

const clerk = vi.hoisted(() => ({
  protect: vi.fn(async () => ({ userId: "user_123" })),
  currentUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(vi.fn(), { protect: clerk.protect }),
  currentUser: clerk.currentUser,
}));

beforeEach(() => {
  clerk.protect.mockClear();
  clerk.currentUser.mockResolvedValue({
    primaryEmailAddress: { emailAddress: EMAIL },
  });
});

async function renderDashboard() {
  const { default: DashboardPage } = await import("@/app/dashboard/page");
  return visibleStrings(renderToStaticMarkup(await DashboardPage()));
}

describe("dashboard page", () => {
  it("shows who is signed in, using the en.json ICU message", async () => {
    const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "DashboardPage" });
    const strings = await renderDashboard();

    expect(strings).toContain(t("signedInAs", { email: EMAIL }));
    expect(strings.join(" ")).toContain(EMAIL);
  });

  it("renders only strings that come from messages/en.json", async () => {
    const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "DashboardPage" });
    const allowed = new Set([...leafStrings(en), t("signedInAs", { email: EMAIL })]);
    const strings = await renderDashboard();

    expect(strings.length).toBeGreaterThan(0);
    for (const s of strings) {
      expect(allowed, `hardcoded string on /dashboard: "${s}"`).toContain(s);
    }
  });

  it("protects itself on the server, not only in the proxy", async () => {
    await renderDashboard();
    expect(clerk.protect).toHaveBeenCalledTimes(1);
  });
});
