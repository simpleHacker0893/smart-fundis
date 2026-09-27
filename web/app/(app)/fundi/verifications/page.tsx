import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PAGE_MAIN } from "@/components/ui/app-type";
import { FundiGuard } from "../fundi-guard";
import { VerificationList } from "./verification-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Verifications");
  return { title: t("meta.title") };
}

/** /fundi/verifications (prompt 27): guarded here, in the proxy and by FundiGuard (spec §4). */
export default async function VerificationsPage() {
  await auth.protect();
  return (
    <main className={PAGE_MAIN}>
      <FundiGuard>
        <VerificationList />
      </FundiGuard>
    </main>
  );
}
