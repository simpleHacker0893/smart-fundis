import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExpertGuard } from "./expert-guard";
import { ReviewQueue } from "./review-queue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ExpertPage");
  return { title: t("meta.title") };
}

/**
 * /expert (#41): the Expert's queue of Assessments awaiting review (US-5.1).
 * Guarded here as well as in the proxy (D-15); ExpertGuard checks the Expert
 * role once `users.me` loads (spec §4). Unstyled for V1; Stitch styling in V3.
 */
export default async function ExpertPage() {
  await auth.protect();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <ExpertGuard>
        <ReviewQueue />
      </ExpertGuard>
    </main>
  );
}
