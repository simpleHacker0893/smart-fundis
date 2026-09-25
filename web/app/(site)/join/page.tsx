import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/landing/page-hero";
import { Tag } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { SIGN_UP_PATH } from "@/lib/auth-routes";
import { isOpenTradeSlug } from "@/lib/trades";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Join");
  return { title: t("meta.title"), description: t("meta.description") };
}

type JoinSearch = { role?: string | string[]; trade?: string | string[] };

/**
 * /join?role=…&trade=… (#27, #14 review): the one Join route. Fundis (and
 * any unknown or missing role) go to Clerk's sign-up with the role kept,
 * and with the trade kept when it is an open trade, so "Verify now"
 * pre-selects it. Expert applications arrive in V4, so role=expert shows a
 * plain "Coming soon" readout, never a form.
 */
export default async function JoinPage({ searchParams }: { searchParams: Promise<JoinSearch> }) {
  const { role, trade } = await searchParams;
  if (role !== "expert") {
    const tradeParam = isOpenTradeSlug(trade) ? `&trade=${trade}` : "";
    redirect(`${SIGN_UP_PATH}?role=fundi${tradeParam}`);
  }

  const [t, common] = await Promise.all([getTranslations("Join"), getTranslations("Common")]);
  return (
    <main className="flex w-full flex-1 flex-col">
      <PageHero
        label={t("expert.label")}
        title={t("expert.title")}
        body={t("expert.body")}
        actions={
          <div className="flex max-w-md flex-col gap-3 sm:flex-row">
            <Tag>{common("comingSoon")}</Tag>
            <Link href="/evidence" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
              {t("expert.evidence")}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center text-sm text-foreground/75 underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("expert.home")}
            </Link>
          </div>
        }
      />
    </main>
  );
}
