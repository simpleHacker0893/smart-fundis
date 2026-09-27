"use client"; // Error boundaries must be Client Components

import { useTranslations } from "next-intl";
import { ErrorPanel } from "@/components/app-states";
import { PAGE_MAIN, PAGE_TITLE } from "@/components/ui/app-type";

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
    <main className={PAGE_MAIN}>
      <h1 className={PAGE_TITLE}>{t("title")}</h1>
      <ErrorPanel body={t("error.body")} tag={t("error.tag")} retry={t("error.retry")} onRetry={() => retry()} />
    </main>
  );
}
