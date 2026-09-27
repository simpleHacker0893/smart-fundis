"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { LABEL } from "@/components/ui/field-label";
import { useCatalogueNames } from "@/components/use-catalogue-names";

type QueueRow = FunctionReturnType<typeof api.reviews.queue>[number];

/**
 * The Assessments awaiting this Expert's decision, oldest first as
 * reviews.queue returns them (US-5.1). A Convex query, so a decided row
 * leaves the list with no refresh. Each row opens /expert/<id>. Mount it
 * only for an Expert: reviews.queue throws for anyone else.
 */
export function ReviewQueue() {
  const t = useTranslations("ReviewQueue");
  const queue = useQuery(api.reviews.queue, {});

  return (
    <section className="flex flex-col gap-3" aria-labelledby="expert-queue">
      <h2 id="expert-queue" className="text-xl font-semibold">
        {t("title")}
      </h2>
      <p className="text-sm text-foreground/75">{t("intro")}</p>
      {queue === undefined ? (
        <LoadingSkeleton label={t("loading")} />
      ) : queue.length === 0 ? (
        <p className="text-base">{t("empty")}</p>
      ) : (
        <ul aria-live="polite" className="flex flex-col gap-3">
          {queue.map((row) => (
            <QueueItem key={row.assessmentId} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueItem({ row }: { row: QueueRow }) {
  const t = useTranslations("ReviewQueue");
  const format = useFormatter();
  const names = useCatalogueNames();

  return (
    <li data-testid="queue-row">
      <Link
        href={`/expert/${row.assessmentId}`}
        className="flex min-h-12 flex-col gap-2 rounded border border-line p-4 hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="text-base font-medium break-words">
          {t("taskLine", {
            trade: names.trade(row.tradeSlug, row.tradeName),
            task: names.task(row.taskSlug, row.taskName),
          })}
        </span>
        <span className={LABEL}>
          {t("uploaded", { date: format.dateTime(row._creationTime, { dateStyle: "medium" }) })}
        </span>
        {/* Automation bias: the queue row never names the AI's
            verdict, only the safety-flag count. The labelled "AI suggestion —
            you decide" panel lives on the detail view instead. */}
        <span className="text-sm">{t("safetyFlags", { count: row.safetyFlagCount })}</span>
      </Link>
    </li>
  );
}
