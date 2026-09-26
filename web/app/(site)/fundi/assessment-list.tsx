"use client";

import { useQuery } from "convex/react";
import { useFormatter, useTranslations } from "next-intl";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { LABEL } from "@/components/ui/field-label";
import { useCatalogueNames } from "@/components/use-catalogue-names";

type Assessment = FunctionReturnType<typeof api.assessments.listMine>[number];

/**
 * The Fundi's Assessments, newest first, each with a plain status chip
 * (US-3.1, US-4.1; spec #36 decision 4). `listMine` is a Convex query, so a
 * status change re-renders the chip with no refresh and no polling. The list
 * is aria-live so a screen reader hears the change. Mount it only for a
 * Fundi: listMine throws for anyone else.
 */
export function AssessmentList() {
  const t = useTranslations("AssessmentList");
  const assessments = useQuery(api.assessments.listMine, {});
  // Nothing until there is something to show, so the upload comes first.
  if (assessments === undefined || assessments.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="fundi-assessments">
      <h2 id="fundi-assessments" className="text-xl font-semibold">
        {t("title")}
      </h2>
      <ul aria-live="polite" className="flex flex-col gap-3">
        {assessments.map((assessment) => (
          <AssessmentItem key={assessment._id} assessment={assessment} />
        ))}
      </ul>
    </section>
  );
}

function AssessmentItem({ assessment }: { assessment: Assessment }) {
  const t = useTranslations("AssessmentList");
  const format = useFormatter();
  const names = useCatalogueNames();
  const detail = statusDetail(assessment, t);

  return (
    <li data-testid="assessment" className="flex flex-col gap-2 rounded border border-line p-4">
      <span className="text-base break-words">
        {t("taskLine", {
          trade: names.trade(assessment.tradeSlug, assessment.tradeName),
          task: names.task(assessment.taskSlug, assessment.taskName),
        })}
      </span>
      <span className={LABEL}>
        {t("sent", { date: format.dateTime(assessment._creationTime, { dateStyle: "medium" }) })}
      </span>
      <span
        data-testid="status-chip"
        data-status={assessment.status}
        className="self-start rounded-full border border-line px-3 py-1 text-sm font-medium"
      >
        {t(`status.${assessment.status}`)}
      </span>
      {detail ? <span className="text-sm text-foreground/75">{detail}</span> : null}
    </li>
  );
}

/** The extra line under a reshoot or rejection chip, or null. */
function statusDetail(assessment: Assessment, t: ReturnType<typeof useTranslations<"AssessmentList">>) {
  if (assessment.status === "reshoot") {
    // The reason's own en/sw text is the AI's; the web shows its copy by code.
    return assessment.reshootReason ? t(`reshootReasons.${assessment.reshootReason.code}`) : t("reshootByExpert");
  }
  // listMine does not carry the Expert's note yet (reviews come with #41).
  if (assessment.status === "rejected") return t("rejectedNote");
  return null;
}
