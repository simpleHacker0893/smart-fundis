"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { CHIP } from "@/components/ui/chip";
import { LABEL } from "@/components/ui/field-label";
import { useCatalogueNames } from "@/components/use-catalogue-names";
import { DecisionForm } from "./decision-form";

type Detail = NonNullable<FunctionReturnType<typeof api.reviews.detail>>;

const BACK_LINK =
  "inline-flex min-h-12 items-center self-start text-base underline underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring";

/**
 * One Assessment for an Expert (US-5.2): the Fundi's video, the Liveness
 * code, the AI's Observation per Rubric item and its suggestion, and the
 * decision form while it awaits review. reviews.detail is null when the
 * Assessment is missing or the caller may not decide it. The confidence
 * number never reaches the client. Mount it only for an Expert.
 */
export function ReviewDetail({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations("ReviewDetail");
  // The id comes from the URL; a malformed one makes the query throw, which error.tsx catches.
  const detail = useQuery(api.reviews.detail, { assessmentId: assessmentId as Id<"assessments"> });

  if (detail === undefined) return <LoadingSkeleton label={t("loading")} />;
  if (detail === null) return <NotAvailable />;
  return <DetailBody detail={detail} />;
}

/** The "not available" message with a link back to the queue. */
export function NotAvailable() {
  const t = useTranslations("ReviewDetail");
  return (
    <>
      <p className="text-base">{t("notAvailable")}</p>
      <Link href="/expert" className={BACK_LINK}>
        {t("backToQueue")}
      </Link>
    </>
  );
}

function DetailBody({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  const format = useFormatter();
  const names = useCatalogueNames();
  const open = detail.status === "awaiting_review";

  return (
    <>
      <Link href="/expert" className={BACK_LINK}>
        {t("backToQueue")}
      </Link>
      <section className="flex flex-col gap-2" aria-labelledby="review-task">
        <h2 id="review-task" className="text-xl font-semibold break-words">
          {t("taskLine", {
            trade: names.trade(detail.tradeSlug, detail.tradeName),
            task: names.task(detail.taskSlug, detail.taskName),
          })}
        </h2>
        <span className={LABEL}>
          {t("uploaded", { date: format.dateTime(detail._creationTime, { dateStyle: "medium" }) })}
        </span>
      </section>

      <VideoSection detail={detail} />
      <Liveness detail={detail} />
      <RubricSection detail={detail} />
      <AiSuggestion detail={detail} />

      {open ? <DecisionForm assessmentId={detail._id} /> : <p className="text-base">{t("decided")}</p>}
    </>
  );
}

function VideoSection({ detail }: { detail: Detail }) {
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
  const openStatus = detail.status === "awaiting_review" || detail.status === "appealed";
  const message =
    detail.videoDeletedAt !== undefined ? t("videoDeleted") : openStatus ? t("videoUnavailable") : t("videoClosed");
  return (
    <section className="flex flex-col gap-2" aria-labelledby="review-video">
      <h3 id="review-video" className="text-lg font-semibold">
        {t("videoTitle")}
      </h3>
      {detail.videoUrl ? (
        <video
          src={detail.videoUrl}
          controls
          playsInline
          preload="metadata"
          // Defence in depth against a casual download or
          // cast, not a guarantee — a determined viewer can still capture
          // the stream some other way.
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          className="aspect-video w-full rounded border border-line bg-black"
        />
      ) : (
        <p className="text-base text-foreground/75">{message}</p>
      )}
    </section>
  );
}

function Liveness({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  return (
    <section data-testid="liveness" className="flex flex-col gap-2" aria-labelledby="review-liveness">
      <h3 id="review-liveness" className="text-lg font-semibold">
        {t("liveness.title")}
      </h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className={LABEL}>{t("liveness.shown")}</dt>
        <dd className="font-mono text-base">{detail.livenessCode}</dd>
        <dt className={LABEL}>{t("liveness.read")}</dt>
        <dd className="font-mono text-base">{detail.livenessRead ?? t("liveness.notRead")}</dd>
        <dt className={LABEL}>{t("liveness.result")}</dt>
        <dd className="text-base">{t(`liveness.check.${detail.livenessCheck ?? "none"}`)}</dd>
      </dl>
    </section>
  );
}

/** Seconds into the video as m:ss. */
function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function RubricSection({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  const names = useCatalogueNames();
  const flagged = new Set(detail.safetyFlags);
  const byItem = new Map(detail.observations.map((o) => [o.itemId, o]));

  return (
    <section className="flex flex-col gap-3" aria-labelledby="review-rubric">
      <h3 id="review-rubric" className="text-lg font-semibold">
        {t("rubricTitle")}
      </h3>
      <ol className="flex flex-col gap-3">
        {detail.rubricItems.map((item) => {
          const observation = byItem.get(item.id);
          return (
            <li key={item.id} data-testid="rubric-item" className="flex flex-col gap-2 rounded border border-line p-4">
              <span className="text-base break-words">{names.rubricItem(detail.taskSlug, item.id, item.text)}</span>
              {item.safety || flagged.has(item.id) ? (
                <span className="flex flex-wrap gap-2">
                  {item.safety ? <span className={CHIP}>{t("safetyItem")}</span> : null}
                  {flagged.has(item.id) ? <span className={`${CHIP} border-primary`}>{t("flagged")}</span> : null}
                </span>
              ) : null}
              <span className="text-sm font-medium">
                {t("observation", { result: t(`result.${observation?.result ?? "none"}`) })}
              </span>
              {observation ? (
                <>
                  {observation.evidence ? (
                    <span className="text-sm text-foreground/75 break-words">{observation.evidence}</span>
                  ) : null}
                  <span className={LABEL}>{t("at", { time: clock(observation.timestampS) })}</span>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AiSuggestion({ detail }: { detail: Detail }) {
  const t = useTranslations("ReviewDetail");
  const tq = useTranslations("ReviewQueue");
  return (
    <section
      data-testid="ai-suggestion"
      className="flex flex-col gap-3 rounded border border-line p-4"
      aria-labelledby="review-ai"
    >
      <h3 id="review-ai" className="text-lg font-semibold">
        {t("ai.title")}
      </h3>
      <p className="text-sm text-foreground/75">{t("ai.intro")}</p>
      <p className="text-base font-medium">{t("ai.verdict", { verdict: tq(`verdict.${detail.verdict ?? "none"}`) })}</p>
      {detail.fallbackModel ? <p className={LABEL}>{t("ai.fallback")}</p> : null}
      <TextList title={t("ai.strengths")} items={detail.strengths} />
      <TextList title={t("ai.gaps")} items={detail.gaps} />
      <div className="flex flex-col gap-1">
        <h4 className={LABEL}>{t("ai.feedback")}</h4>
        <p className="text-base break-words">{detail.feedbackEn ?? t("ai.none")}</p>
      </div>
    </section>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  const t = useTranslations("ReviewDetail");
  return (
    <div className="flex flex-col gap-1">
      <h4 className={LABEL}>{title}</h4>
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
