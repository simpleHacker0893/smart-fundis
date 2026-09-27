import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PAGE_MAIN, PAGE_TITLE } from "@/components/ui/app-type";
import { FundiGuard } from "../fundi-guard";
import { UploadFlow } from "../upload-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("RecordPage");
  return { title: t("meta.title") };
}

/**
 * /fundi/record (prompt 26 frames 8–10): the #38 upload flow, moved here
 * from the old /fundi page and restyled in app mode. Guarded here, in the
 * proxy and by FundiGuard (spec §4).
 */
export default async function RecordPage() {
  await auth.protect();
  const t = await getTranslations("RecordPage");
  return (
    <main className={PAGE_MAIN}>
      <FundiGuard>
        <header className="flex flex-col gap-3">
          <h1 className={PAGE_TITLE}>{t("title")}</h1>
          <p className="text-base text-dim">{t("intro")}</p>
        </header>
        <UploadFlow />
      </FundiGuard>
    </main>
  );
}
