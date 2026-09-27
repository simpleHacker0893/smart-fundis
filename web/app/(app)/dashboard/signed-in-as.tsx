"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@convex/_generated/api";

/**
 * Shows the email from `users.me`. Until `me` has a row it shows the email the
 * server passed in, so the first render never waits or errors. The row itself
 * is created by StoreUserOnAuth in ConvexClientProvider.
 */
export function SignedInAs({ fallbackEmail }: { fallbackEmail: string | null }) {
  const t = useTranslations("DashboardPage");
  const { isAuthenticated } = useConvexAuth();
  // `me` needs a signed-in caller, so it waits for Convex auth (null when signed out).
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const email = me?.user?.email ?? fallbackEmail;

  return (
    <p className="text-base text-muted-foreground">
      {email ? t("signedInAs", { email }) : t("signedIn")}
    </p>
  );
}
