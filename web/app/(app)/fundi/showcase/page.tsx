import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MONO_TAG, PAGE_MAIN, PAGE_TITLE } from "@/components/ui/app-type";
import { FundiGuard } from "../fundi-guard";
import { ShowcaseLinks } from "./showcase-links";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ShowcasePage");
  return { title: t("meta.title") };
}

/**
 * /fundi/showcase: the Showcase links (US-3.8, ADR-7) on their own page,
 * tagged "Showcase — not verified" so nobody takes them for verification.
 * Guarded here, in the proxy and by FundiGuard (spec §4).
 */
export default async function ShowcasePage() {
  await auth.protect();
  const t = await getTranslations("ShowcasePage");
  const s = await getTranslations("Showcase");
  return (
    <main className={PAGE_MAIN}>
      <FundiGuard>
        <header className="flex flex-col gap-3">
          <h1 className={PAGE_TITLE}>{t("title")}</h1>
          <span className={MONO_TAG}>{s("label")}</span>
        </header>
        <ShowcaseLinks />
      </FundiGuard>
    </main>
  );
}
