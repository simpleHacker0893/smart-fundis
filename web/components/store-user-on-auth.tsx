"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Creates or updates the caller's `users` row once per signed-in session, on
 * any page. Rendered inside ConvexClientProvider. `users.store` is idempotent,
 * so a repeat is harmless; a failure is logged and retried at the next sign-in.
 */
export function StoreUserOnAuth() {
  const { isAuthenticated } = useConvexAuth();
  const store = useMutation(api.users.store);
  const storedThisSession = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      storedThisSession.current = false;
      return;
    }
    if (storedThisSession.current) return;
    storedThisSession.current = true;
    store({}).catch((error: unknown) => {
      console.error("users.store failed", error);
    });
  }, [isAuthenticated, store]);

  return null;
}
