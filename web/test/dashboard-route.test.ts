import { describe, expect, it } from "vitest";
import { BUILT_ROLE_ROUTES, dashboardPath, type Me } from "@/lib/dashboard-route";

const USER = { _id: "users_1", email: "a@example.com" };

function me(roles: Partial<Me["roles"]>, user: unknown = USER): Me {
  return { user, roles: { base: "none", expert: false, admin: false, ...roles } };
}

const ALL_BUILT = { admin: true, expert: true, fundi: true } as const;

describe("dashboardPath (spec §4 routing)", () => {
  it("sends a User with no Fundi profile to /onboarding", () => {
    expect(dashboardPath(me({}), ALL_BUILT)).toBe("/onboarding");
  });

  it("sends a Fundi to /fundi", () => {
    expect(dashboardPath(me({ base: "fundi" }), ALL_BUILT)).toBe("/fundi");
  });

  it("sends an Expert to /expert, ahead of their Fundi role", () => {
    expect(dashboardPath(me({ base: "fundi", expert: true }), ALL_BUILT)).toBe("/expert");
    expect(dashboardPath(me({ expert: true }), ALL_BUILT)).toBe("/expert");
  });

  it("sends an Admin to /admin, ahead of every other role", () => {
    expect(dashboardPath(me({ base: "fundi", expert: true, admin: true }), ALL_BUILT)).toBe("/admin");
    expect(dashboardPath(me({ admin: true }), ALL_BUILT)).toBe("/admin");
  });

  it("skips a role whose dashboard is not built yet", () => {
    const onlyFundi = { admin: false, expert: false, fundi: true };
    expect(dashboardPath(me({ base: "fundi", expert: true, admin: true }), onlyFundi)).toBe("/fundi");
    // An Expert with no Fundi profile, before /expert exists, has only onboarding.
    expect(dashboardPath(me({ expert: true }), onlyFundi)).toBe("/onboarding");
  });

  it("sends a caller whose users row is not stored yet to /onboarding", () => {
    expect(dashboardPath(me({}, null), ALL_BUILT)).toBe("/onboarding");
  });

  it("defaults to the dashboards built so far: /fundi, not /admin or /expert (#37; /expert is #41)", () => {
    expect(BUILT_ROLE_ROUTES).toEqual({ admin: false, expert: false, fundi: true });
    expect(dashboardPath(me({ base: "fundi", expert: true, admin: true }))).toBe("/fundi");
  });
});
