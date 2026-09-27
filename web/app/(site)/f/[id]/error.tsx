"use client"; // Error boundaries must be Client Components

import { useTranslations } from "next-intl";

/**
 * Convex could not be reached while loading the profile. Show the plain
 * "not available right now" line, never the error text. Next.js passes
 * `{ error, reset }`; neither is used here.
 */
export default function PublicProfileError(_props: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("PublicProfile");
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <p className="text-base text-foreground/75">{t("unavailable")}</p>
    </main>
  );
}
