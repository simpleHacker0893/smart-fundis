"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@convex/_generated/api";

/**
 * Creates or updates the caller's `users` row once Convex has the Clerk token,
 * then shows the email from `users.me`. Until `me` resolves it shows the email
 * the server passed in, so the first render never waits or errors.
 */
export function SignedInAs({ fallbackEmail }: { fallbackEmail: string | null }) {
  const t = useTranslations("DashboardPage");
  const { isAuthenticated } = useConvexAuth();
  const store = useMutation(api.users.store);
  const stored = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || stored.current) return;
    stored.current = true;
    store({}).catch((error: unknown) => {
      stored.current = false;
      console.error("users.store failed", error);
    });
  }, [isAuthenticated, store]);

  // `me` requires a signed-in caller, so it waits for Convex auth.
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const email = me?.email ?? fallbackEmail;

  return (
    <p className="text-base text-muted-foreground">
      {email ? t("signedInAs", { email }) : t("signedIn")}
    </p>
  );
}
