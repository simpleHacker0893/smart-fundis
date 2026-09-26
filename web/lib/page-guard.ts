import type { Roles } from "@convex/lib/auth";
import { AFTER_AUTH_PATH } from "@/lib/auth-routes";
import type { Me } from "@/lib/dashboard-route";

/** Where a role page sends a caller who lacks its role (spec §4). */
export const DASHBOARD_PATH = AFTER_AUTH_PATH;

export type PageGuard<M extends Me = Me> =
  | { kind: "loading" }
  | { kind: "redirect"; to: string }
  | { kind: "allow"; me: M };

/** The Fundi role (ADR-18): a Fundi profile exists. */
export const isFundi = (roles: Roles): boolean => roles.base === "fundi";

/**
 * A role page's guard (spec §4): loading until `users.me` resolves, then the
 * page if the caller holds the role, else back to /dashboard. `null` (signed
 * out) stays loading: the proxy and auth.protect() handle signed-out visits.
 * UX only: every Convex function checks the role again (ADR-18).
 */
export function pageGuard<M extends Me>(
  me: M | null | undefined,
  holds: (roles: Roles) => boolean,
): PageGuard<M> {
  if (!me) return { kind: "loading" };
  return holds(me.roles) ? { kind: "allow", me } : { kind: "redirect", to: DASHBOARD_PATH };
}
