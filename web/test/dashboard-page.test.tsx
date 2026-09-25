import { createTranslator, NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { leafStrings, visibleStrings } from "./copy-helpers";

const CLERK_EMAIL = "wanjiru@example.com";
const CONVEX_EMAIL = "wanjiru@convex.example";

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

// Convex as the client sees it: auth state, the `me` result and `store`.
const convex = vi.hoisted(() => ({
  isAuthenticated: false,
  me: undefined as { email: string } | null | undefined,
  queryArgs: [] as unknown[],
  store: vi.fn(async () => "users_id"),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isLoading: !convex.isAuthenticated, isAuthenticated: convex.isAuthenticated }),
  useMutation: () => convex.store,
  useQuery: (_ref: unknown, args: unknown) => {
    convex.queryArgs.push(args);
    return args === "skip" ? undefined : convex.me;
  },
}));

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "DashboardPage" });

beforeEach(() => {
  clerk.protect.mockClear();
  clerk.currentUser.mockResolvedValue({
    primaryEmailAddress: { emailAddress: CLERK_EMAIL },
  });
  convex.isAuthenticated = false;
  convex.me = undefined;
  convex.queryArgs = [];
  convex.store.mockClear();
});

async function renderDashboard() {
  const { default: DashboardPage } = await import("@/app/dashboard/page");
  const page = await DashboardPage();
  return visibleStrings(
    renderToStaticMarkup(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        {page}
      </NextIntlClientProvider>,
    ),
  );
}

describe("dashboard page", () => {
  it("shows the server's email on first render, before Convex auth is ready", async () => {
    const strings = await renderDashboard();

    expect(strings).toContain(t("signedInAs", { email: CLERK_EMAIL }));
    // users.me needs a signed-in caller, so it is skipped until Convex has the token.
    expect(convex.queryArgs).toEqual(["skip"]);
  });

  it("keeps the server's email while users.me is loading", async () => {
    convex.isAuthenticated = true;
    convex.me = undefined;
    const strings = await renderDashboard();

    expect(strings).toContain(t("signedInAs", { email: CLERK_EMAIL }));
    expect(convex.queryArgs).toEqual([{}]);
  });

  it("keeps the server's email when users.me is null (store has not run yet)", async () => {
    convex.isAuthenticated = true;
    convex.me = null;
    expect(await renderDashboard()).toContain(t("signedInAs", { email: CLERK_EMAIL }));
  });

  it("shows the email from users.me once it resolves", async () => {
    convex.isAuthenticated = true;
    convex.me = { email: CONVEX_EMAIL };
    const strings = await renderDashboard();

    expect(strings).toContain(t("signedInAs", { email: CONVEX_EMAIL }));
    expect(strings.join(" ")).not.toContain(CLERK_EMAIL);
  });

  it("falls back to plain copy when no email is known yet", async () => {
    clerk.currentUser.mockResolvedValue(null);
    expect(await renderDashboard()).toContain(t("signedIn"));
  });

  it("renders only strings that come from messages/en.json", async () => {
    const allowed = new Set([...leafStrings(en), t("signedInAs", { email: CLERK_EMAIL })]);
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
