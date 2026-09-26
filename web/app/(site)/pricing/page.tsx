import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/landing/page-hero";
import { Section, SectionLabel, SectionTitle, Tag } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { JOIN_FUNDI_PATH } from "@/lib/site-nav";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pricing");
  return { title: t("meta.title"), description: t("meta.description") };
}

const FREE = ["verify", "profile", "find", "payments"] as const;
const PLANNED = ["pro", "bookings"] as const;

/**
 * /pricing (#30). True to the MVP: everything is free and there are no
 * payments in the app (PRD §1). What may cost money later comes from PRD
 * §10 (Production) and is tagged "Planned · may change": readouts only,
 * with no buy buttons, invented tiers, discounts or "most popular" labels.
 * No Stitch screen: it follows /about's layout language.
 */
export default async function PricingPage() {
  const [t, links] = await Promise.all([getTranslations("Pricing"), getTranslations("Links")]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <PageHero
        label={t("hero.label")}
        title={t("hero.title")}
        body={t("hero.body")}
        actions={
          <Link href={JOIN_FUNDI_PATH} className={pillClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
            {links("joinAsFundi")}
          </Link>
        }
        aside={
          <div className="rounded border border-line bg-panel p-5 sm:p-6">
            <p className="mb-4 font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("hero.readout")}</p>
            <p className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("hero.priceLabel")}</p>
            <p className="mt-1 font-mono text-5xl font-bold">{t("hero.price")}</p>
            <p className="mt-4 border-t border-line pt-4 text-sm text-foreground/75">{t("hero.note")}</p>
          </div>
        }
      />

      <Section id="free">
        <SectionLabel>{t("free.label")}</SectionLabel>
        <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {FREE.map((item) => (
            <li key={item} className="flex flex-col gap-3 rounded border border-line bg-panel p-5">
              <Tag>{t("free.tag")}</Tag>
              <span className="text-lg font-bold tracking-tight">{t(`free.items.${item}.title`)}</span>
              <span className="text-sm text-foreground/75">{t(`free.items.${item}.body`)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="planned">
        <SectionLabel>{t("planned.label")}</SectionLabel>
        <SectionTitle>{t("planned.title")}</SectionTitle>
        <p className="mb-8 max-w-2xl text-base text-foreground/75">{t("planned.body")}</p>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PLANNED.map((item) => (
            // A readout, never a buy button (#30).
            <li key={item} className="flex flex-col gap-3 rounded border border-line bg-panel p-5 sm:p-6">
              <Tag>{t("planned.tag")}</Tag>
              <span className="text-lg font-bold tracking-tight">{t(`planned.items.${item}.title`)}</span>
              <span className="font-mono text-sm">{t(`planned.items.${item}.price`)}</span>
              <span className="text-sm text-foreground/75">{t(`planned.items.${item}.body`)}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/#roadmap"
          className="mt-6 inline-flex min-h-12 items-center gap-2 font-mono text-xs font-bold tracking-wider uppercase hover:text-foreground/80"
        >
          {t("planned.roadmap")}
          <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </Link>
      </Section>
    </main>
  );
}
