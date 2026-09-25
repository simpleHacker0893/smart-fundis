import { ArrowDown, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Section, SectionLabel } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { SIGN_UP_PATH } from "@/lib/auth-routes";
import { BENCH_TRADES } from "@/lib/landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Trades");
  return { title: t("meta.title"), description: t("meta.description") };
}

/** The two open trades: photo, markers and which rubric steps are safety steps. */
const OPEN_TRADES = [
  { key: "electrical", image: "/images/landing-socket-wiring-1280.webp", safety: ["1", "3"] },
  { key: "hairdressing", image: "/images/sf-braiding-hands-1280.webp", safety: ["1"] },
] as const;

/** Bench tiles with a matching reviewed photo; the others show a plain grain strip. */
const BENCH_IMAGES: Partial<Record<(typeof BENCH_TRADES)[number], string>> = {
  plumbing: "/images/trades-plumbing-720.webp",
  masonry: "/images/sf-hands-wrench-720.webp",
  carpentry: "/images/trades-carpentry-720.webp",
  welding: "/images/trades-welding-720.webp",
  mechanic: "/images/sf-mechanic-apron-720.webp",
  tailoring: "/images/trades-tailoring-720.webp",
  beauty: "/images/sf-braiding-hands-720.webp",
  solar: "/images/trades-solar-720.webp",
};

const STEPS = ["1", "2", "3", "4"] as const;

type BenchWithImage = "plumbing" | "masonry" | "carpentry" | "welding" | "mechanic" | "tailoring" | "beauty" | "solar";

/**
 * /trades — the trade catalogue (#22), from 03-trades-v3-responsive with
 * prompt 03-trades.md copy. Honesty fixes over the export: "open", never
 * "LIVE"; no "SYSTEM ACTIVE" or "tamper-evident log" readouts; the rubric
 * preview is tagged EXAMPLE; bench trades are plain readouts.
 */
export default async function TradesPage() {
  const [t, names, landing] = await Promise.all([
    getTranslations("Trades"),
    getTranslations("Landing.trades.names"),
    getTranslations("Landing"),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <Section id="top" className="film-grain py-12 sm:py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel>{t("hero.label")}</SectionLabel>
            <h1 className="mb-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block">{t("hero.titleLine1")}</span>
              <span className="block">{t("hero.titleLine2")}</span>
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
            <Link href="#open" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
              {t("hero.cta")}
              <ArrowDown aria-hidden="true" className="ml-2 size-4" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="lg:col-span-5">
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
          </div>
        </div>
      </Section>

      <Section id="open">
        <SectionLabel>{t("open.label")}</SectionLabel>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {OPEN_TRADES.map((trade, index) => (
            <article key={trade.key} className="flex flex-col gap-5 rounded border border-line bg-panel p-3 sm:p-4">
              <EvidenceFrame
                label={t("open.trade", { n: `0${index + 1}`, trade: names(trade.key) })}
                tag={landing("inspector.example")}
                src={trade.image}
                alt={t(`open.${trade.key}.imageAlt`)}
                markers={[t(`open.${trade.key}.markers.1`), t(`open.${trade.key}.markers.2`)]}
                aspect="aspect-video"
                sizes="(min-width: 1024px) 600px, 100vw"
              />
              <div className="px-1">
                <p className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("open.task")}</p>
                <h2 className="text-2xl font-bold tracking-tight">{t(`open.${trade.key}.task`)}</h2>
              </div>
              <div className="rounded border border-line bg-background/60">
                <p className="border-b border-line px-4 py-2.5 font-mono text-xs tracking-widest text-foreground/75 uppercase">
                  {t("open.rubric")}
                </p>
                <ul className="divide-y divide-line text-sm">
                  {STEPS.map((step) => (
                    <li key={step} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span>{t(`open.${trade.key}.steps.${step}`)}</span>
                      {(trade.safety as readonly string[]).includes(step) && (
                        <span className="rounded border border-amber/60 px-2 py-0.5 font-mono text-xs tracking-widest text-amber uppercase">
                          {t("open.safety")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={SIGN_UP_PATH} className={pillClass({ variant: "primary", size: "full" })}>
                {t("open.verifyNow")}
                <ArrowRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2} />
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section id="bench">
        <SectionLabel>{t("bench.label")}</SectionLabel>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {BENCH_TRADES.map((trade) => {
            const src = BENCH_IMAGES[trade];
            return (
              // A plain readout at full opacity: not a link, not a disabled button (HANDOFF §5).
              <li key={trade} className="flex flex-col gap-3 rounded border border-line bg-panel p-2.5">
                <div className="relative aspect-video overflow-hidden rounded bg-background film-grain">
                  {src && (
                    <Image
                      src={src}
                      alt={t(`bench.imageAlt.${trade as BenchWithImage}`)}
                      fill
                      sizes="(min-width: 1024px) 240px, 50vw"
                      className="object-cover opacity-80 contrast-125 grayscale"
                    />
                  )}
                </div>
                <div className="px-1 pb-1">
                  <p className="font-mono text-xs tracking-widest text-foreground/60 uppercase">{t("bench.comingSoon")}</p>
                  <p className="text-sm font-semibold">{names(trade)}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-col items-start justify-between gap-2 rounded border border-line bg-panel p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-foreground/75">{t("bench.note")}</p>
          <Link
            href="/#roadmap"
            className="inline-flex min-h-12 items-center gap-1 font-mono text-xs font-bold tracking-wider text-amber uppercase"
          >
            {t("bench.roadmap")}
            <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </Section>
    </main>
  );
}

