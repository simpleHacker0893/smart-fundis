"use client"; // Error boundaries must be Client Components

import { useTranslations } from "next-intl";
import { OUTLINE_PILL, PAGE, PAGE_TITLE } from "./expert-styles";
import { ReadoutPanel } from "./expert-ui";

/**
 * The queue's error state (#67 screen 28, D9): a bordered readout with ✕
 * "COULDN'T LOAD", the reason in plain words and an outlined "Try again".
 * Never the error text, and never amber. Next.js 16.3 passes
 * `{ error, retry, reset }`; `retry()` re-renders the segment and re-fetches.
 * /expert/[assessmentId] has its own boundary.
 */
export default function QueueError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  const t = useTranslations("ReviewQueue");
  return (
    <main className={PAGE}>
      <h1 className={PAGE_TITLE}>{t("title")}</h1>
      <ReadoutPanel
        tag={t("error.tag")}
        error
        action={
          <button type="button" className={OUTLINE_PILL} onClick={() => retry()}>
            {t("error.retry")}
          </button>
        }
      >
        {t("error.body")}
      </ReadoutPanel>
    </main>
  );
}
