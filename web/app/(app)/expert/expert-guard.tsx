"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAvailable } from "@/components/convex-available";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { isExpert, pageGuard } from "@/lib/page-guard";

/**
 * The spec §4 page guard for /expert and its detail pages: a skeleton until
 * `users.me` loads, then the children for an Expert, or back to /dashboard
 * for anyone else. The children mount only once the guard allows, because
 * the reviews queries throw for a non-Expert. UX only: every Convex function
 * checks the role again (ADR-18).
 */
export function ExpertGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("ExpertPage");
  // Convex hooks throw outside a Convex provider (a build with no Convex URL).
  if (!useConvexAvailable()) return <p className="text-base text-dim">{t("unavailable")}</p>;
  return <Guarded>{children}</Guarded>;
}

function Guarded({ children }: { children: ReactNode }) {
  const t = useTranslations("ExpertPage");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  // `me` needs a signed-in caller, so it waits for Convex auth (null when signed out).
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const guard = pageGuard(me, isExpert);
  const redirectTo = guard.kind === "redirect" ? guard.to : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (guard.kind !== "allow") return <LoadingSkeleton label={t("loading")} />;

  // Each page renders its own h1 (the queue title, or the Task on review).
  return <>{children}</>;
}
