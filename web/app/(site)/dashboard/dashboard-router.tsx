"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAvailable } from "@/components/convex-available";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { dashboardPath } from "@/lib/dashboard-route";

/**
 * `/dashboard` routing (spec §4): a loading skeleton until `users.me`
 * resolves, then a replace to the caller's dashboard or /onboarding. UX only:
 * each page and every Convex function checks the role again (ADR-18).
 */
export function DashboardRouter() {
  // Convex hooks throw outside a Convex provider (a build with no Convex URL).
  return useConvexAvailable() ? <RouteOnceLoaded /> : null;
}

function RouteOnceLoaded() {
  const t = useTranslations("DashboardPage");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  // `me` needs a signed-in caller, so it waits for Convex auth. It is null
  // when signed out: keep loading (the proxy sends signed-out visitors away).
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (me) router.replace(dashboardPath(me));
  }, [me, router]);

  return <LoadingSkeleton label={t("loading")} />;
}
