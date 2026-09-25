import { ArrowDown, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { PageHero } from "@/components/landing/page-hero";
import { Section, SectionLabel, Tag } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { BENCH_TRADES, OPEN_TRADES, verifyHref } from "@/lib/trades";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Trades");
  return { title: t("meta.title"), description: t("meta.description") };
}

/** Rubric steps that are safety steps, per open trade. */
const SAFETY_STEPS = { electrical: ["1", "3"], hairdressing: ["1"] } as const;
const STEPS = ["1", "2", "3", "4"] as const;

/**
 * /trades — the trade catalogue (#22), from 03-trades-v3-responsive with
 * prompt 03-trades.md copy. Honesty fixes over the export: "open", never
 * "LIVE"; no "SYSTEM ACTIVE" or "tamper-evident log" readouts; the rubric
 * preview is tagged EXAMPLE; bench trades are plain readouts. Trades come
 * from lib/trades.ts.
 */
export default async function TradesPage() {
  const [t, names, common] = await Promise.all([
    getTranslations("Trades"),
    getTranslations("Landing.trades.names"),
    getTranslations("Common"),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <PageHero
        label={t("hero.label")}
        title={[t("hero.titleLine1"), t("hero.titleLine2")]}
        body={t("hero.body")}
        actions={
          <Link href="#open" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
            {t("hero.cta")}
            <ArrowDown aria-hidden="true" className="ml-2 size-4" strokeWidth={1.5} />
          </Link>
        }
        aside={
          <div className="rounded border border-line bg-panel p-5 sm:p-6">
            <p className="mb-4 font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("hero.readout")}</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["open", "bench"] as const).map((key) => (
                <div key={key} className="rounded border border-line bg-background/60 p-4">
                  <dt className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t(`hero.${key}Label`)}</dt>
                  <dd className="mt-1 text-sm font-semibold">{t(`hero.${key}Value`)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-line pt-4 text-sm text-foreground/75">{t("hero.rule")}</p>
          </div>
        }
      />

      <Section id="open">
        <SectionLabel>{t("open.label")}</SectionLabel>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {OPEN_TRADES.map((trade, index) => {
            const safety: readonly string[] = SAFETY_STEPS[trade.slug];
            return (
              <article key={trade.slug} className="flex flex-col gap-5 rounded border border-line bg-panel p-3 sm:p-4">
                <EvidenceFrame
                  label={t("open.trade", { n: `0${index + 1}`, trade: names(trade.slug) })}
                  tag={common("example")}
                  src={trade.image.src}
                  alt={t(`imageAlt.${trade.image.alt}`)}
                  markers={[t(`open.${trade.slug}.markers.1`), t(`open.${trade.slug}.markers.2`)]}
                  aspect="aspect-video"
                  sizes="(min-width: 1024px) 600px, 100vw"
                />
                <div className="px-1">
                  <p className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("open.task")}</p>
                  <h2 className="text-2xl font-bold tracking-tight">{t(`open.${trade.slug}.task`)}</h2>
                </div>
                <div className="rounded border border-line bg-background/60">
                  <p className="border-b border-line px-4 py-2.5 font-mono text-xs tracking-widest text-foreground/75 uppercase">
                    {t("open.rubric")}
                  </p>
                  <ul className="divide-y divide-line text-sm">
                    {STEPS.map((step) => (
                      <li key={step} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span>{t(`open.${trade.slug}.steps.${step}`)}</span>
                        {safety.includes(step) && <Tag tone="amber">{t("open.safety")}</Tag>}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={verifyHref(trade.slug)} className={pillClass({ variant: "primary", size: "full" })}>
                  {t("open.verifyNow")}
                  <ArrowRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2} />
                </Link>
              </article>
            );
          })}
        </div>
      </Section>

      <Section id="bench">
        <SectionLabel>{t("bench.label")}</SectionLabel>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {BENCH_TRADES.map(({ slug, icon: Icon, image }) => (
            // A plain readout at full opacity: not a link, not a disabled button (HANDOFF §5).
            <li key={slug} className="flex flex-col gap-3 rounded border border-line bg-panel p-2.5">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded bg-background film-grain">
                {image ? (
                  <Image
                    src={image.src}
                    alt={t(`imageAlt.${image.alt}`)}
                    fill
                    sizes="(min-width: 1024px) 240px, 50vw"
                    className="object-cover opacity-80 contrast-125 grayscale"
                  />
                ) : (
                  // No matching photo: a grain strip with the trade's icon (#20 review).
                  <Icon aria-hidden="true" className="size-8 text-foreground/50" strokeWidth={1.5} />
                )}
              </div>
              <div className="px-1 pb-1">
                <p className="font-mono text-xs tracking-widest text-foreground/60 uppercase">{common("comingSoon")}</p>
                <p className="text-sm font-semibold">{names(slug)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col items-start justify-between gap-2 rounded border border-line bg-panel p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-foreground/75">{t("bench.note")}</p>
          <Link
            href="/#roadmap"
            className="inline-flex min-h-12 items-center gap-1 font-mono text-xs font-bold tracking-wider uppercase hover:text-foreground/80"
          >
            {t("bench.roadmap")}
            <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </Section>
    </main>
  );
}
