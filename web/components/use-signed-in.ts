import { useAuth } from "@clerk/nextjs";

/**
 * A hook for client components (it has no "use client" of its own).
 * True once Clerk has loaded and the visitor is signed in. While Clerk is
 * loading (and on the server) it is false, so the shell renders the
 * signed-out links first and never waits on auth to show its buttons.
 */
export function useSignedIn(): boolean {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded === true && isSignedIn === true;
}
