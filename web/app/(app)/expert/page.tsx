import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExpertGuard } from "./expert-guard";
import { PAGE } from "./expert-styles";
import { ReviewQueue } from "./review-queue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ExpertPage");
  return { title: t("meta.title") };
}

/**
 * /expert (#41): the Expert's queue of Assessments awaiting review (US-5.1).
 * Guarded here as well as in the proxy (D-15); ExpertGuard checks the Expert
 * role once `users.me` loads (spec §4). Styled as #67 screen 28, inside the
 * app shell from the (app) layout.
 */
export default async function ExpertPage() {
  await auth.protect();

  return (
    <main className={PAGE}>
      <ExpertGuard>
        <ReviewQueue />
      </ExpertGuard>
    </main>
  );
}
