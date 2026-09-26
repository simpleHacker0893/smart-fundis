import { describe, expect, it } from "vitest";
import type { Me } from "@/lib/dashboard-route";
import { DASHBOARD_PATH, isFundi, pageGuard } from "@/lib/page-guard";

const USER = { _id: "users_1", email: "a@example.com", name: "Wanjiru", county: "Nairobi" };

function me(roles: Partial<Me["roles"]>, user: unknown = USER): Me {
  return { user, roles: { base: "none", expert: false, admin: false, ...roles } };
}

describe("pageGuard (spec §4 page guards)", () => {
  it("is loading while users.me has not resolved", () => {
    expect(pageGuard(undefined, isFundi)).toEqual({ kind: "loading" });
  });

  it("stays loading when users.me is null (signed out; the proxy handles it)", () => {
    expect(pageGuard(null, isFundi)).toEqual({ kind: "loading" });
  });

  it("lets a Fundi in and hands back what users.me returned", () => {
    const fundi = me({ base: "fundi" });
    expect(pageGuard(fundi, isFundi)).toEqual({ kind: "allow", me: fundi });
  });

  it("sends a User with no Fundi profile back to /dashboard", () => {
    expect(pageGuard(me({}), isFundi)).toEqual({ kind: "redirect", to: DASHBOARD_PATH });
    expect(DASHBOARD_PATH).toBe("/dashboard");
  });

  it("sends an Expert or Admin who is not a Fundi back to /dashboard", () => {
    expect(pageGuard(me({ expert: true }), isFundi)).toEqual({ kind: "redirect", to: DASHBOARD_PATH });
    expect(pageGuard(me({ admin: true }), isFundi)).toEqual({ kind: "redirect", to: DASHBOARD_PATH });
  });

  it("sends a caller with no stored row back to /dashboard", () => {
    expect(pageGuard(me({}, null), isFundi)).toEqual({ kind: "redirect", to: DASHBOARD_PATH });
  });

  it("lets in an Expert or Admin who is also a Fundi", () => {
    const both = me({ base: "fundi", expert: true, admin: true });
    expect(pageGuard(both, isFundi)).toEqual({ kind: "allow", me: both });
  });
});
