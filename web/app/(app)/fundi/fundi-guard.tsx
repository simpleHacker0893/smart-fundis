"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAvailable } from "@/components/convex-available";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { isFundi, pageGuard } from "@/lib/page-guard";

/**
 * The spec §4 page guard for every /fundi page: a skeleton until `users.me`
 * loads, then the page for a Fundi, or back to /dashboard for anyone else.
 * The children mount only once the guard allows, because their queries
 * throw for a non-Fundi. UX only: every Convex function checks the role
 * again (ADR-18).
 */
export function FundiGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("FundiPage");
  // Convex hooks throw outside a Convex provider (a build with no Convex URL).
  if (!useConvexAvailable()) return <p className="text-base text-dim">{t("unavailable")}</p>;
  return <Guarded>{children}</Guarded>;
}

function Guarded({ children }: { children: ReactNode }) {
  const t = useTranslations("FundiPage");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  // `me` needs a signed-in caller, so it waits for Convex auth (null when signed out).
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const guard = pageGuard(me, isFundi);
  const redirectTo = guard.kind === "redirect" ? guard.to : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (guard.kind !== "allow") return <LoadingSkeleton label={t("loading")} />;
  return <>{children}</>;
}

