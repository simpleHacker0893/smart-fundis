import type { Roles } from "@convex/lib/auth";

/** What `/dashboard` needs from `users.me`: the stored row (or null) and the derived roles. */
export type Me = { user: unknown; roles: Roles };

export const ONBOARDING_PATH = "/onboarding";

/** The role dashboards, in the order `/dashboard` tries them (spec §4). */
const ROLE_ROUTES = [
  { role: "admin", path: "/admin", holds: (r: Roles) => r.admin },
  { role: "expert", path: "/expert", holds: (r: Roles) => r.expert },
  { role: "fundi", path: "/fundi", holds: (r: Roles) => r.base === "fundi" },
] as const;

type RoleRoute = (typeof ROLE_ROUTES)[number]["role"];

/**
 * Which role dashboards exist. A role whose page is not built is skipped, so
 * an Expert who is also a Fundi lands on /fundi until /expert ships (#41).
 * Flip a flag to true in the PR that builds that page.
 */
export const BUILT_ROLE_ROUTES: Readonly<Record<RoleRoute, boolean>> = {
  admin: false,
  expert: false,
  fundi: true,
};

/**
 * Where `/dashboard` sends a signed-in User (spec §4): Admin, then Expert,
 * then Fundi, each only if its page is built; otherwise /onboarding. This is
 * UX only: every page and Convex function checks the role again (ADR-18).
 */
export function dashboardPath(me: Me, built: Readonly<Record<RoleRoute, boolean>> = BUILT_ROLE_ROUTES): string {
  const match = ROLE_ROUTES.find(({ role, holds }) => built[role] && holds(me.roles));
  return match?.path ?? ONBOARDING_PATH;
}
