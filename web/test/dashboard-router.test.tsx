// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "DashboardPage" });

const state = vi.hoisted(() => ({
  isAuthenticated: true,
  me: undefined as unknown,
  replace: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isLoading: !state.isAuthenticated, isAuthenticated: state.isAuthenticated }),
  useQuery: (_ref: unknown, args: unknown) => (args === "skip" ? undefined : state.me),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace, push: vi.fn() }),
}));

const USER = { _id: "users_1", email: "a@example.com" };
const roles = (r: object = {}) => ({ base: "none", expert: false, admin: false, ...r });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.isAuthenticated = true;
  state.me = undefined;
  state.replace.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render({ convexAvailable = true } = {}) {
  const { DashboardRouter } = await import("@/app/(site)/dashboard/dashboard-router");
  const { ConvexAvailableContext } = await import("@/components/convex-available");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en}>
        <ConvexAvailableContext value={convexAvailable}>
          <DashboardRouter />
        </ConvexAvailableContext>
      </NextIntlClientProvider>,
    );
  });
}

describe("DashboardRouter (spec §4)", () => {
  it("shows a loading status and does not route while users.me is loading", async () => {
    await render();
    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toBe(t("loading"));
    expect(status?.getAttribute("aria-busy")).toBe("true");
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("does not route before Convex auth is ready", async () => {
    state.isAuthenticated = false;
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    expect(state.replace).not.toHaveBeenCalled();
  });

  it("sends a User with no Fundi profile to /onboarding", async () => {
    state.me = { user: USER, roles: roles() };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/onboarding");
  });

  it("sends a Fundi to /fundi", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi" }) };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/fundi");
  });

  it("sends an Expert who is also a Fundi to /fundi until /expert is built (#41)", async () => {
    state.me = { user: USER, roles: roles({ base: "fundi", expert: true, admin: true }) };
    await render();
    expect(state.replace).toHaveBeenCalledWith("/fundi");
  });

  it("renders nothing and never routes without Convex", async () => {
    await render({ convexAvailable: false });
    expect(container.textContent).toBe("");
    expect(state.replace).not.toHaveBeenCalled();
  });
});
