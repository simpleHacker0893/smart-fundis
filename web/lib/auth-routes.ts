// Auth routes shared by the proxy and ClerkProvider. Paths only, no secrets.
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const AFTER_AUTH_PATH = "/dashboard";
/** Where Clerk sends visitors after they sign out (#28). Public. */
export const SIGNED_OUT_PATH = "/signed-out";

// Architecture spec §4: the proxy only requires sign-in, for these prefixes.
// Every protected page must also call auth.protect() itself: Clerk advises
// never relying on the proxy alone (D-15), so this list is a UX redirect,
// never the only guard. Roles are checked by each page and in Convex (ADR-18).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/application-pending",
  "/fundi",
  "/expert",
  "/admin",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
