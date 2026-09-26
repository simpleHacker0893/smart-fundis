"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAvailable } from "@/components/convex-available";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { LABEL } from "@/components/ui/field-label";
import { isFundi, pageGuard } from "@/lib/page-guard";

/**
 * The /fundi body behind the spec §4 page guard: a skeleton until `users.me`
 * loads, then the page for a Fundi, or back to /dashboard for anyone else.
 * UX only: every Convex function checks the role again (ADR-18).
 *
 * `users.me` carries the name and county from the users row; the Fundi's
 * Trade lives on fundiProfiles and is not shown yet (#38 adds the Fundi's own
 * query with the Assessment list).
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

  const user = guard.me.user;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      {user ? (
        <dl className="flex flex-col gap-4">
          {user.name ? (
            <div className="flex flex-col gap-1">
              <dt className={LABEL}>{t("name")}</dt>
              <dd className="text-base break-words">{user.name}</dd>
            </div>
          ) : null}
          {user.county ? (
            <div className="flex flex-col gap-1">
              <dt className={LABEL}>{t("county")}</dt>
              <dd className="text-base">{user.county}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </>
  );
}
