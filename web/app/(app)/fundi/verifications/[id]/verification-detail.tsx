"use client";

import { useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "cn";
import { api } from "@convex/_generated/api";
import { ScopedErrors, SkeletonCard } from "@/components/app-states";
import { META, PAGE_TITLE, PANEL, SECTION_LABEL } from "@/components/ui/app-type";
import { BadgeLine } from "@/components/badge-line";
import { SECONDARY_PILL } from "@/components/ui/pill";
import { STATUS_GLYPHS, StatusChip } from "@/components/ui/status-chip";
import { useCatalogueNames } from "@/components/use-catalogue-names";
import { type Assessment, badgeOf, useAssessmentMeta } from "../../verification-row";

const LINK_FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * One verification for its Fundi (prompt 27, spec §11.0), read from
 * assessments.listMine so a status change shows live. It renders from the
 * status alone, so `awaiting_review` is the same markup whatever the AI said
 * (D-50). The Expert's note shows only on reshoot and rejected, never on
 * approved (#41: the approve note is for the record). No AI panels yet (they
 * need dashboard.fundiVerifications, #48), no video player (the Fundi has no
 * video URL) and no Appeal or Delete (V4).
 */
export function VerificationDetail({ id }: { id: string }) {
  const t = useTranslations("Verifications");
  return (
    <>
      <Link
        href="/fundi/verifications"
        className={cn("inline-flex min-h-12 items-center gap-2 self-start text-base text-dim hover:text-foreground", LINK_FOCUS)}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
        {t("back")}
      </Link>
      <ScopedErrors body={t("error.body")}>
        <DetailBody id={id} />
      </ScopedErrors>
    </>
  );
}

function DetailBody({ id }: { id: string }) {
  const t = useTranslations("Verifications");
  const names = useCatalogueNames();
  const meta = useAssessmentMeta();
  // Found in listMine, which is capped at the newest 100 Assessments: an older
  // one reads as "not found". The proper fix is an owner-scoped query for one
  // Assessment by id (dashboard.fundiVerifications, #48).
  const list = useQuery(api.assessments.listMine, {});
  if (list === undefined) return <SkeletonCard label={t("loading")} />;

  const assessment = list.find((item) => item._id === id);
  if (assessment === undefined) {
    return (
      <div className={cn(PANEL, "flex flex-col gap-3")}>
        <p className="text-base">{t("notFound.body")}</p>
        <Link href="/fundi/verifications" className={cn("inline-flex min-h-12 items-center self-start underline underline-offset-4", LINK_FOCUS)}>
          {t("notFound.back")}
        </Link>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-8 lg:gap-12">
      <header className="flex flex-col gap-3">
        <h1 className={PAGE_TITLE}>{names.task(assessment.taskSlug, assessment.taskName)}</h1>
        <p className={META}>{meta(assessment, "detailMeta")}</p>
        <div data-testid="detail-status">
          <StatusChip status={assessment.status} />
        </div>
      </header>
      <div aria-live="polite" className="flex flex-col gap-6">
        <StatusContent assessment={assessment} />
      </div>
    </article>
  );
}

function StatusContent({ assessment }: { assessment: Assessment }) {
  const t = useTranslations("Verifications");
  const tl = useTranslations("AssessmentList");
  switch (assessment.status) {
    case "queued":
    case "analyzing":
    case "awaiting_review":
    case "appealed":
      // Only the status is read here: never a Verdict, score or AI hint before a decision (D-50).
      return <p className="text-base">{t(`status.${assessment.status}`)}</p>;
    case "failed":
      return (
        <>
          <p className="flex items-start gap-2 text-base">
            <span aria-hidden="true">{STATUS_GLYPHS.failed}</span>
            <span>{t("status.failed")}</span>
          </p>
          <RecordAgain />
        </>
      );
    case "reshoot":
      return (
        <>
          {assessment.expertNote ? <ExpertNote note={assessment.expertNote} /> : null}
          <p className="text-base">
            {/* The reason's own text is the AI's; the web shows its en.json copy by code (D-64). */}
            {assessment.reshootReason ? tl(`reshootReasons.${assessment.reshootReason.code}`) : tl("reshootByExpert")}
          </p>
          <RecordAgain />
        </>
      );
    case "rejected":
      return (
        <>
          {assessment.expertNote ? <ExpertNote note={assessment.expertNote} /> : null}
          <p className="text-base">{tl("rejectedNote")}</p>
        </>
      );
    case "approved": {
      // No Expert's note here, ever (#41).
      const badge = badgeOf(assessment);
      return badge ? <BadgeLine badge={badge} /> : null;
    }
  }
}

/** Human content sits first and heavier than anything else on the page. */
function ExpertNote({ note }: { note: string }) {
  const t = useTranslations("Verifications");
  return (
    <div data-testid="expert-note" className={cn(PANEL, "flex flex-col gap-2")}>
      <p className={SECTION_LABEL}>{t("expertNote")}</p>
      <p className="text-base font-medium break-words">{note}</p>
    </div>
  );
}

function RecordAgain() {
  const t = useTranslations("Verifications");
  return (
    <Link href="/fundi/record" className={cn(SECONDARY_PILL, LINK_FOCUS)}>
      {t("recordAgain")}
    </Link>
  );
}
