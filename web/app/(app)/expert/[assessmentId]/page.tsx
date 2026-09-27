import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExpertGuard } from "../expert-guard";
import { PAGE } from "../expert-styles";
import { ReviewDetail } from "./review-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ReviewDetail");
  return { title: t("meta.title") };
}

/**
 * /expert/<assessmentId> (#41): one Assessment for an Expert to review and
 * decide (US-5.2, US-5.3). Same guards as /expert: auth.protect() here and in
 * the proxy, the Expert role in ExpertGuard, and canDecide in Convex.
 * Styled as #67 screen 29, inside the app shell from the (app) layout.
 */
export default async function ReviewPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  await auth.protect();
  const { assessmentId } = await params;

  return (
    <main className={PAGE}>
      <ExpertGuard>
        <ReviewDetail assessmentId={assessmentId} />
      </ExpertGuard>
    </main>
  );
}
