"use client";

import type { FunctionReturnType } from "convex/server";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import type { api } from "@convex/_generated/api";
import { META } from "@/components/ui/app-type";
import type { BadgeFields } from "@/components/badge-line";
import { StatusChip } from "@/components/ui/status-chip";
import { useCatalogueNames } from "@/components/use-catalogue-names";

/** One of the Fundi's Assessments, as assessments.listMine returns it. */
export type Assessment = FunctionReturnType<typeof api.assessments.listMine>[number];

/** An approved Assessment with an Expert's decision date is a Badge (US-5.4). */
export function badgeOf(assessment: Assessment): BadgeFields | null {
  if (assessment.status !== "approved" || assessment.decidedAt === undefined) return null;
  const { tradeSlug, tradeName, taskSlug, taskName, decidedAt } = assessment;
  return { tradeSlug, tradeName, taskSlug, taskName, decidedAt };
}

/**
 * The mono meta line: "ELECTRICAL · 25 SEP 2026" on a row, "ELECTRICAL ·
 * RECORDED 25 SEP 2026" on the detail. The words are sentence case in
 * en.json; the META class uppercases them.
 */
export function useAssessmentMeta() {
  const t = useTranslations("Verifications");
  const format = useFormatter();
  const names = useCatalogueNames();
  return (assessment: Assessment, kind: "rowMeta" | "detailMeta" = "rowMeta") => {
    const at = assessment._creationTime;
    return t(kind, {
      trade: names.trade(assessment.tradeSlug, assessment.tradeName),
      day: format.dateTime(at, { day: "numeric" }),
      month: format.dateTime(at, { month: "short" }),
      year: format.dateTime(at, { year: "numeric" }),
    });
  };
}

/**
 * A hairline row (D3): the Task as the title, the mono meta line and one
 * neutral status chip. The whole row links to the detail. The chip is keyed
 * on the status only, so awaiting_review looks the same for every Verdict.
 */
export function VerificationRow({ assessment }: { assessment: Assessment }) {
  const names = useCatalogueNames();
  const meta = useAssessmentMeta();
  return (
    <li data-testid="verification-row" className="border-b border-line">
      <Link
        href={`/fundi/verifications/${assessment._id}`}
        className="flex min-h-14 items-center justify-between gap-4 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="line-clamp-2 text-base font-semibold break-words">
            {names.task(assessment.taskSlug, assessment.taskName)}
          </span>
          <span className={META}>{meta(assessment)}</span>
        </span>
        <StatusChip status={assessment.status} className="shrink-0 self-center" />
      </Link>
    </li>
  );
}
