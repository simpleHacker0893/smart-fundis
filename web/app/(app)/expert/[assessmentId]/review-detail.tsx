"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ChevronLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EmptyPanel } from "@/components/app-states";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { META, OUTLINE_TAG, PAGE_TITLE, SECTION_LABEL } from "@/components/ui/app-type";
import { STATUS_GLYPHS } from "@/components/ui/status-chip";
import { useCatalogueNames } from "@/components/use-catalogue-names";
import { cn } from "cn";
import { useWaitingAge } from "../expert-ui";
import { DecisionForm } from "./decision-form";

type Detail = NonNullable<FunctionReturnType<typeof api.reviews.detail>>;

const BACK_LINK =
  "inline-flex min-h-12 items-center gap-2 self-start text-base text-dim hover:text-foreground";

/**
 * One Assessment for an Expert (US-5.2; #67 screen 29): the Fundi's video,
 * the Liveness readout, the AI's Observations (safety items first), #41's AI
 * suggestion panel (locked until the video has played through), and the
 * decision below it while it awaits review.
 * reviews.detail is null when the Assessment is missing or the caller may
 * not decide it. The confidence number never reaches the client.
 *
 * Layout: one column on mobile with the player sticky under the header;
 * from 1024 px, two columns (the player, Liveness and decision on the left
 * 7/12, the Observations and AI panel on the right 5/12). The DOM order
 * keeps the decision after the AI panel. Mount it only for an Expert.
 */
export function ReviewDetail({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations("ReviewDetail");
  // The id comes from the URL; a malformed one makes the query throw, which error.tsx catches.
  const detail = useQuery(api.reviews.detail, { assessmentId: assessmentId as Id<"assessments"> });

  if (detail === undefined) return <LoadingSkeleton label={t("loading")} />;
  if (detail === null) return <NotAvailable />;
  // Keyed by the Assessment, so the AI panel's lock starts over for each one.
  return <DetailBody key={detail._id} detail={detail} />;
}

/** The "not available" readout with the way back to the queue. No player, no AI panel. */
export function NotAvailable() {
  const t = useTranslations("ReviewDetail");
  return (
    <EmptyPanel body={t("notAvailable")}>
      <Link href="/expert" className={`${BACK_LINK} text-foreground underline underline-offset-4`}>
        {t("backToQueue")}
      </Link>
    </EmptyPanel>
  );
}

function DetailBody({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  const tq = useTranslations("ReviewQueue");
  const names = useCatalogueNames();
  const age = useWaitingAge();
  const [videoFailed, setVideoFailed] = useState(false);
  // UX only: the AI suggestion stays locked until the Expert has watched the
  // whole video once (D-51, automation bias). A failed or deleted video never
  // unlocks it; the decision form stays usable either way. The real gate is
  // on the server: expert.markPlayedThrough, with reviews.detail returning
  // aiSuggestion: null until the video has played through (#52). Until then
  // the suggestion is in the client's data, only not drawn.
  const [playedThrough, setPlayedThrough] = useState(false);
  const open = detail.status === "awaiting_review";
  const trade = names.trade(detail.tradeSlug, detail.tradeName);
  const playing = detail.videoUrl !== null && !videoFailed;

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link href="/expert" className={BACK_LINK}>
          <ChevronLeft aria-hidden="true" className="size-5" />
          {t("backLink")}
        </Link>
        <h1 className={PAGE_TITLE}>{names.task(detail.taskSlug, detail.taskName)}</h1>
        <p className={META}>{open ? tq("meta", { trade, age: age(detail._creationTime) }) : trade}</p>
      </header>

      <div
        className={cn(
          "grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-x-8 lg:gap-y-12",
          // Focus never hides under the sticky player on mobile (WCAG 2.4.11).
          playing && "max-lg:**:scroll-mt-[calc(3.5rem+min(56.25vw,40dvh)+2rem)]",
        )}
      >
        <VideoSection
          detail={detail}
          failed={videoFailed}
          onFail={() => setVideoFailed(true)}
          onEnded={() => setPlayedThrough(true)}
          className={cn(
            "lg:col-span-7 lg:col-start-1 lg:row-start-1",
            playing && "sticky top-14 z-20 -mx-4 bg-background px-4 pb-2 lg:static lg:mx-0 lg:px-0 lg:pb-0",
          )}
        />
        <Liveness detail={detail} className="lg:col-span-7 lg:col-start-1 lg:row-start-2" />
        <div className="flex flex-col gap-8 lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1">
          <Observations detail={detail} />
          <AiSuggestion detail={detail} locked={!playedThrough} />
        </div>
        <div className="lg:col-span-7 lg:col-start-1 lg:row-start-3">
          {open ? <DecisionForm assessmentId={detail._id} /> : <p className="text-base">{t("decided")}</p>}
        </div>
      </div>
    </>
  );
}

function VideoSection({
  detail,
  failed,
  onFail,
  onEnded,
  className,
}: {
  detail: Detail;
  failed: boolean;
  onFail: () => void;
  onEnded: () => void;
  className?: string;
}) {
  const t = useTranslations("ReviewDetail");
  // Backend invariant (convex/reviews.ts VIDEO_STATUSES): reviews.detail
  // signs a video URL only while the Assessment is awaiting_review or
  // appealed; in any other status videoUrl is always null, whether or not
  // the video has actually been deleted. So a null videoUrl means one of
  // three different things, and each gets its own line:
  //  - videoDeletedAt is set: the video really has been deleted.
  //  - still open (awaiting_review/appealed) but no videoDeletedAt: the
  //    video should be there but failed to load, so say so and suggest retrying.
  //  - a closed status (decided): nothing is wrong, the video is simply no
  //    longer shown once a decision has been made.
  // A signed URL the player can't load (onError) also reads "couldn't load".
  const openStatus = detail.status === "awaiting_review" || detail.status === "appealed";
  const deleted = detail.videoDeletedAt !== undefined;
  const unavailable = failed || (!deleted && openStatus);
  const message = deleted ? t("videoDeleted") : unavailable ? t("videoUnavailable") : t("videoClosed");

  return (
    <section className={className} aria-label={t("videoLabel")}>
      {detail.videoUrl && !failed ? (
        <video
          src={detail.videoUrl}
          aria-label={t("videoLabel")}
          controls
          playsInline
          preload="metadata"
          // Defence in depth against a casual download or
          // cast, not a guarantee — a determined viewer can still capture
          // the stream some other way.
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onError={onFail}
          onEnded={onEnded}
          className="aspect-video max-h-[40dvh] w-full rounded border border-line bg-panel lg:max-h-none"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center gap-2 rounded border border-line bg-panel p-4 text-center text-base">
          {unavailable && !deleted ? <span aria-hidden="true">{STATUS_GLYPHS.failed}</span> : null}
          <p>{message}</p>
        </div>
      )}
    </section>
  );
}

function Liveness({ detail, className }: { detail: Detail; className?: string }) {
  const t = useTranslations("ReviewDetail");
  const result = t(`liveness.result.${detail.livenessCheck ?? "none"}`);
  return (
    <section data-testid="liveness" className={cn("flex flex-col gap-3", className)} aria-labelledby="review-liveness">
      <h2 id="review-liveness" className={SECTION_LABEL}>
        {t("liveness.title")}
      </h2>
      <ul className="flex flex-col gap-1 font-mono text-xs tracking-[0.08em] uppercase tabular-nums">
        <li>{t("liveness.shown", { code: detail.livenessCode })}</li>
        <li>
          {detail.livenessRead !== undefined
            ? t("liveness.read", { code: detail.livenessRead })
            : t("liveness.notReadable")}
        </li>
        <li>{t("liveness.check", { result })}</li>
      </ul>
      <p className="text-base text-dim">{t("liveness.note")}</p>
    </section>
  );
}

/** Whole seconds into the video as m:ss, or h:mm:ss past an hour (D5). */
function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

function Observations({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  const names = useCatalogueNames();
  const flagged = new Set(detail.safetyFlags);
  const byItem = new Map(detail.observations.map((o) => [o.itemId, o]));
  // Safety items first, otherwise in Rubric order (a stable sort).
  const items = [...detail.rubricItems].sort((a, b) => Number(b.safety) - Number(a.safety));

  return (
    <section className="flex flex-col gap-3" aria-labelledby="review-observations">
      <h2 id="review-observations" className={SECTION_LABEL}>
        {t("observations.title")}
      </h2>
      <ol className="flex flex-col border-t border-line">
        {items.map((item) => {
          const observation = byItem.get(item.id);
          return (
            <li key={item.id} data-testid="observation" className="flex gap-3 border-b border-line py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {item.safety || flagged.has(item.id) ? (
                  <span className="flex flex-wrap gap-2">
                    {item.safety ? (
                      <span data-testid="safety-tag" className={OUTLINE_TAG}>
                        {t("observations.safety")}
                      </span>
                    ) : null}
                    {flagged.has(item.id) ? <span className={OUTLINE_TAG}>{t("observations.flagged")}</span> : null}
                  </span>
                ) : null}
                <p className="text-base break-words">{names.rubricItem(detail.taskSlug, item.id, item.text)}</p>
                <p className="text-base font-semibold">
                  {t(`observations.answer.${observation?.result ?? "none"}`)}
                </p>
                {observation?.evidence ? (
                  <p className="flex items-start gap-2">
                    <span data-testid="ai-tag" className={OUTLINE_TAG}>
                      {t("aiTag")}
                    </span>
                    <q className="min-w-0 text-base break-words text-foreground">{observation.evidence}</q>
                  </p>
                ) : null}
              </div>
              <span
                data-testid="timestamp"
                className="flex min-h-12 min-w-12 shrink-0 justify-end font-mono text-xs text-dim tabular-nums"
              >
                {observation ? (
                  clock(observation.timestampS)
                ) : (
                  <>
                    <span aria-hidden="true">{"--:--"}</span>
                    <span className="sr-only">{t("observations.noTimestamp")}</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * #41's AI panel: the Verdict in words only, strengths, gaps, the feedback
 * and the backup-model line, as a 1 px outlined panel with the AI tag; no
 * fill, no amber, no ✓ and no confidence (D5). While `locked` it shows only
 * a line lock icon and why: no blurred preview, nothing of the suggestion in
 * the DOM (D-51; the server-side gate is #52).
 */
function AiSuggestion({ detail, locked }: { detail: Detail; locked: boolean }) {
  const t = useTranslations("ReviewDetail");
  return (
    <section
      data-testid="ai-suggestion"
      data-locked={locked ? "true" : "false"}
      className="flex flex-col gap-4 rounded border border-line p-4 lg:p-6"
      aria-labelledby="review-ai"
    >
      <span data-testid="ai-tag" className={OUTLINE_TAG}>
        {t("aiTag")}
      </span>
      <div className="flex flex-col gap-1">
        <h2 id="review-ai" className="text-base font-semibold">
          {t("ai.title")}
        </h2>
        <p className="text-base text-dim">{t("ai.intro")}</p>
      </div>
      {locked ? (
        <p className="flex items-start gap-3 text-base">
          <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
          <span>{t("ai.locked")}</span>
        </p>
      ) : (
        <AiSuggestionBody detail={detail} />
      )}
    </section>
  );
}

function AiSuggestionBody({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  return (
    <>
      <p className="text-base">{t("ai.verdict", { verdict: t(`ai.verdictWord.${detail.verdict ?? "none"}`) })}</p>
      {detail.fallbackModel ? <p className={META}>{t("ai.fallback")}</p> : null}
      <TextList title={t("ai.strengths")} items={detail.strengths} />
      <TextList title={t("ai.gaps")} items={detail.gaps} />
      <div className="flex flex-col gap-1">
        <h3 className={SECTION_LABEL}>{t("ai.feedback")}</h3>
        <p className="text-base break-words">{detail.feedbackEn ?? t("ai.none")}</p>
      </div>
    </>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  const t = useTranslations("ReviewDetail");
  return (
    <div className="flex flex-col gap-1">
      <h3 className={SECTION_LABEL}>{title}</h3>
      {items.length === 0 ? (
        <p className="text-base">{t("ai.none")}</p>
      ) : (
        <ul className="list-disc pl-5">
          {items.map((item, i) => (
            <li key={i} className="text-base break-words">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
