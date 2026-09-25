// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const convex = vi.hoisted(() => ({
  isAuthenticated: false,
  store: vi.fn<(args: object) => Promise<string>>(async () => "users_id"),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isLoading: false,
    isAuthenticated: convex.isAuthenticated,
  }),
  useMutation: () => convex.store,
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  convex.isAuthenticated = false;
  convex.store.mockReset();
  convex.store.mockResolvedValue("users_id");
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
});

async function render() {
  const { StoreUserOnAuth } = await import("@/components/store-user-on-auth");
  await act(async () => root.render(<StoreUserOnAuth />));
}

describe("StoreUserOnAuth", () => {
  it("does not call users.store before Convex is authenticated", async () => {
    await render();
    expect(convex.store).not.toHaveBeenCalled();
  });

  it("calls users.store once when Convex becomes authenticated, and not again on re-render", async () => {
    await render();
    convex.isAuthenticated = true;
    await render();
    await render();

    expect(convex.store).toHaveBeenCalledTimes(1);
    expect(convex.store).toHaveBeenCalledWith({});
  });

  it("logs a failure and retries on the next authenticated render", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    convex.store.mockRejectedValueOnce(new Error("boom"));
    convex.isAuthenticated = true;
    await render();
    expect(log).toHaveBeenCalled();

    // Signing out and in again (a new session) stores again.
    convex.isAuthenticated = false;
    await render();
    convex.isAuthenticated = true;
    await render();
    expect(convex.store).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });

  it("stores again for a new session after sign-out", async () => {
    convex.isAuthenticated = true;
    await render();
    convex.isAuthenticated = false;
    await render();
    convex.isAuthenticated = true;
    await render();
    expect(convex.store).toHaveBeenCalledTimes(2);
  });

  it("renders nothing", async () => {
    convex.isAuthenticated = true;
    await render();
    expect(container.innerHTML).toBe("");
  });
});
