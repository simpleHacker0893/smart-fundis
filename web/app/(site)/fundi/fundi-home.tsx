"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAvailable } from "@/components/convex-available";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { isFundi, pageGuard } from "@/lib/page-guard";
import { AssessmentList } from "./assessment-list";
import { UploadFlow } from "./upload-flow";

/**
 * The /fundi body behind the spec §4 page guard: a skeleton until `users.me`
 * loads, then the page for a Fundi, or back to /dashboard for anyone else.
 * UX only: every Convex function checks the role again (ADR-18).
 *
 * The page goes straight to the upload flow, then the Assessment list (#38).
 * The operator removed the name, county and Trades block for an easier
 * upload (2026-09-26). Both mount only once the guard allows, because their
 * queries throw for a non-Fundi.
 */
export function FundiHome() {
  const t = useTranslations("FundiPage");
  // Convex hooks throw outside a Convex provider (a build with no Convex URL).
  if (!useConvexAvailable()) return <p className="text-base text-foreground/75">{t("unavailable")}</p>;
  return <GuardedHome />;
}

function GuardedHome() {
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

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <UploadFlow />
      <AssessmentList />
    </>
  );
}
