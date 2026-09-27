import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PAGE_MAIN } from "@/components/ui/app-type";
import { FundiGuard } from "../../fundi-guard";
import { VerificationDetail } from "./verification-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Verifications");
  return { title: t("meta.detailTitle") };
}

/** /fundi/verifications/[id] (prompt 27): guarded here, in the proxy and by FundiGuard (spec §4). */
export default async function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  await auth.protect();
  const { id } = await params;
  return (
    <main className={PAGE_MAIN}>
      <FundiGuard>
        <VerificationDetail id={id} />
      </FundiGuard>
    </main>
  );
}
