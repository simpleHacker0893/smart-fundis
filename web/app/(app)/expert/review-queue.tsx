"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { useCatalogueNames } from "@/components/use-catalogue-names";
import { cn } from "cn";
import { META, OUTLINE_PILL, OUTLINE_TAG, PAGE_TITLE } from "./expert-styles";
import { ReadoutPanel, useWaitingAge } from "./expert-ui";

type QueueRow = FunctionReturnType<typeof api.reviews.queue>[number];
type Trade = { slug: string; name: string };

/** One mono readout figure, in full white (the only counts allowed, #67). */
const READOUT_ITEM = "py-3 font-mono text-xs tracking-[0.08em] text-foreground uppercase tabular-nums";

/**
 * The Expert's review queue (US-5.1; #67 screen 28): the title, a mono
 * readout (the count by Trade and the oldest wait, the only counts allowed),
 * a client-side Trade filter and hairline rows, oldest first as
 * reviews.queue returns them. A Convex query, so a decided row leaves with
 * no refresh. No AI chip, Verdict, score or thumbnail on a row (automation
 * bias), and no amber fill on this screen. Mount it only for an Expert:
 * reviews.queue throws for anyone else (error.tsx catches it).
 */
export function ReviewQueue() {
  const t = useTranslations("ReviewQueue");
  const queue = useQuery(api.reviews.queue, {});

  return (
    <section className="flex flex-col gap-8 lg:gap-12" aria-labelledby="expert-queue">
      <header className="flex flex-col gap-2">
        <h1 id="expert-queue" className={PAGE_TITLE}>
          {t("title")}
        </h1>
        <p className="text-base text-dim">{t("intro")}</p>
      </header>
      {queue === undefined ? (
        <QueueSkeleton label={t("loading")} />
      ) : queue.length === 0 ? (
        <ReadoutPanel tag={t("empty.tag")}>{t("empty.body")}</ReadoutPanel>
      ) : (
        <QueueBody queue={queue} />
      )}
    </section>
  );
}

function QueueBody({ queue }: { queue: QueueRow[] }) {
  const t = useTranslations("ReviewQueue");
  const names = useCatalogueNames();
  const age = useWaitingAge();
  // The chosen Trade, kept even after its last row leaves, so the filtered-empty state can name it.
  const [selected, setSelected] = useState<Trade | null>(null);

  // Trades in first-seen order (the queue is oldest first), with their counts.
  const counts = new Map<string, { trade: Trade; count: number }>();
  for (const row of queue) {
    const entry = counts.get(row.tradeSlug);
    if (entry) entry.count += 1;
    else counts.set(row.tradeSlug, { trade: { slug: row.tradeSlug, name: names.trade(row.tradeSlug, row.tradeName) }, count: 1 });
  }
  const trades = [...counts.values()].map((c) => c.trade);
  if (selected && !counts.has(selected.slug)) trades.push(selected);
  const oldest = Math.min(...queue.map((row) => row._creationTime));
  const shown = selected ? queue.filter((row) => row.tradeSlug === selected.slug) : queue;

  return (
    <>
      <ul
        data-testid="queue-readout"
        aria-label={t("readoutLabel")}
        className="flex flex-col divide-y divide-line border-y border-line sm:flex-row sm:flex-wrap sm:gap-x-8 sm:divide-y-0"
      >
        {[...counts.values()].map(({ trade, count }) => (
          <li key={trade.slug} className={READOUT_ITEM}>
            {t("tradeCount", { trade: trade.name, count })}
          </li>
        ))}
        <li className={READOUT_ITEM}>{t("oldest", { age: age(oldest) })}</li>
      </ul>

      <div data-testid="trade-filter" role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        <FilterPill pressed={selected === null} onClick={() => setSelected(null)}>
          {t("allTrades")}
        </FilterPill>
        {trades.map((trade) => (
          <FilterPill key={trade.slug} pressed={selected?.slug === trade.slug} onClick={() => setSelected(trade)}>
            {trade.name}
          </FilterPill>
        ))}
      </div>

      {shown.length === 0 && selected ? (
        <ReadoutPanel
          action={
            <button type="button" className={OUTLINE_PILL} onClick={() => setSelected(null)}>
              {t("showAll")}
            </button>
          }
        >
          {t("filteredEmpty", { trade: selected.name })}
        </ReadoutPanel>
      ) : (
        <ul aria-live="polite" className="flex flex-col border-t border-line">
          {shown.map((row) => (
            <QueueItem key={row.assessmentId} row={row} age={age(row._creationTime)} />
          ))}
        </ul>
      )}
    </>
  );
}

/** A 48 px segmented filter pill; the selected one is white on graphite, never amber. */
function FilterPill({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-12 rounded-full border px-5 text-base",
        pressed ? "border-foreground bg-foreground text-background" : "border-line text-foreground hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}

function QueueItem({ row, age }: { row: QueueRow; age: string }) {
  const t = useTranslations("ReviewQueue");
  const names = useCatalogueNames();

  return (
    <li data-testid="queue-row" className="border-b border-line">
      <Link
        href={`/expert/${row.assessmentId}`}
        className="flex min-h-14 items-center gap-3 py-3 hover:bg-foreground/[0.04]"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-base font-semibold break-words">{names.task(row.taskSlug, row.taskName)}</span>
          <span className={META}>{t("meta", { trade: names.trade(row.tradeSlug, row.tradeName), age })}</span>
        </span>
        {/* Automation bias: only the neutral safety marker, never the AI's Verdict. */}
        {row.safetyFlagCount > 0 ? (
          <span data-testid="safety-check" className={OUTLINE_TAG}>
            {t("safetyCheck")}
          </span>
        ) : null}
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-dim" />
      </Link>
    </li>
  );
}

function QueueSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col border-t border-line">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden="true" className="flex min-h-14 flex-col justify-center gap-2 border-b border-line py-3">
          <span className="h-4 w-2/3 animate-pulse rounded bg-panel motion-reduce:animate-none" />
          <span className="h-3 w-1/3 animate-pulse rounded bg-panel motion-reduce:animate-none" />
        </span>
      ))}
    </div>
  );
}
