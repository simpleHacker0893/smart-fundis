import { ArrowDown, ArrowRight, Plug, Scissors, TriangleAlert, Video, Zap, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ExampleTag, Section, SectionLabel, SectionTitle } from "@/components/landing/section";
import { Ledger, StepInspector, StepProvider } from "@/components/landing/step-inspector";
import { SiteLogo } from "@/components/site-logo";
import { pillClass } from "@/components/ui/pill";
import {
  BADGE_LAYERS,
  BENCH_TRADES,
  LIVE_TRADES,
  NEXT_CARDS,
  SCOPE_CHECKS,
  SCOPE_NOT_CHECKED,
} from "@/lib/landing";
import { SIGN_UP_PATH } from "@/lib/auth-routes";
import { PRIMARY_CTAS } from "@/lib/site-nav";

const HERO_IMAGE = "/images/landing-socket-wiring-1280.webp";
const COOP_IMAGE = "/images/landing-coop-bench-1280.webp";

const LIVE_TRADE_ICONS: Record<(typeof LIVE_TRADES)[number], LucideIcon> = {
  electrical: Plug,
  hairdressing: Scissors,
};

/**
 * The landing page, rebuilt from the Stitch screen "Smart Fundis — Kazi yako,
 * sifa yako (Responsive Web App)" (design/stitch/exports/01-landing-v3-responsive),
 * with the copy of prompt 01-landing.md (the prompt wins over the export's
 * text; HANDOFF §1) and the honesty fixes of HANDOFF §5–6: every sample says
 * EXAMPLE, nothing claims to be live, ticks are white, no invented readouts.
 */
export default async function HomePage() {
  const [t, links, glyphs, shell] = await Promise.all([
    getTranslations("Landing"),
    getTranslations("Links"),
    getTranslations("Glyphs"),
    getTranslations("Shell"),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <StepProvider>
        {/* 01 — PROOF OF SKILL */}
        <Section id="evidence" className="film-grain py-12 sm:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col lg:col-span-5">
              <SectionLabel>{t("hero.label")}</SectionLabel>
              <h1 className="mb-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block">{t("hero.titleLine1")}</span>
                <span className="block">{t("hero.titleLine2")}</span>
              </h1>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
              <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:gap-4">
                {PRIMARY_CTAS.map((cta) => (
                  <Link
                    key={cta.key}
                    href={cta.href}
                    className={pillClass({
                      variant: cta.primary ? "primary" : "secondary",
                      size: "full",
                      className: cta.primary ? "sm:w-auto" : "bg-panel sm:w-auto",
                    })}
                  >
                    {links(cta.key)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7">
              <StepInspector imageSrc={HERO_IMAGE} />
            </div>
          </div>
        </Section>

        {/* 02 — RECORD */}
        <Section id="record">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <SectionLabel>{t("record.label")}</SectionLabel>
              <SectionTitle>{t("record.title")}</SectionTitle>
              <p className="mb-6 max-w-xl text-base leading-relaxed text-foreground/75">{t("record.body")}</p>
              <span className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">
                <Video aria-hidden="true" className="size-5" strokeWidth={1.5} />
                {t("record.chip")}
              </span>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded border border-line bg-panel p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-line pb-3 font-mono text-xs tracking-widest text-foreground/75 uppercase">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2 rounded-full bg-amber motion-safe:animate-pulse" />
                    {t("record.panel")}
                  </span>
                  <ExampleTag>{t("inspector.example")}</ExampleTag>
                </div>
                <div className="flex flex-col items-center py-10">
                  <span className="font-mono text-7xl font-bold tracking-[0.2em] sm:text-8xl">{t("record.code")}</span>
                  <span className="mt-4 text-center font-mono text-xs tracking-widest text-foreground/75 uppercase">
                    {t("record.readout")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 03 — CHECK */}
        <Section id="telemetry">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:order-2 lg:col-span-6">
              <SectionLabel>{t("check.label")}</SectionLabel>
              <SectionTitle>{t("check.title")}</SectionTitle>
              <p className="mb-6 max-w-xl text-base leading-relaxed text-foreground/75">{t("check.body")}</p>
              <p className="flex max-w-xl items-start gap-3 rounded border border-line bg-panel p-4 text-sm">
                <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-amber" strokeWidth={1.5} />
                {t("check.safety")}
              </p>
            </div>
            <div className="lg:order-1 lg:col-span-6">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded border border-line bg-panel film-grain">
                {/* The loupe: a decorative instrument, described by its readout below. */}
                <div aria-hidden="true" className="relative flex size-48 items-center justify-center rounded-full border border-foreground/20 sm:size-56">
                  <div className="absolute inset-4 rounded-full border border-dashed border-foreground/15 motion-safe:animate-[spin_24s_linear_infinite]" />
                  <div className="flex size-16 items-center justify-center rounded-full border-2 border-amber">
                    <Zap className="size-7 text-amber" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded border border-line bg-background/90 px-3 py-2 font-mono text-xs tracking-wider uppercase">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{glyphs("pass")}</span>
                    {t("check.loupe")}
                  </span>
                  <span className="text-foreground/75">{t("check.loupeTime")}</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 04 — DECIDE */}
        <Section id="decide">
          <div className="mb-8 max-w-2xl">
            <SectionLabel>{t("decide.label")}</SectionLabel>
            <SectionTitle>{t("decide.title")}</SectionTitle>
            <p className="text-base leading-relaxed text-foreground/75">{t("decide.caption")}</p>
          </div>
          <Ledger />
        </Section>

        {/* 05 — BADGE */}
        <Section id="badge">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:order-2 lg:col-span-6">
              <SectionLabel>{t("badge.label")}</SectionLabel>
              <SectionTitle>{t("badge.title")}</SectionTitle>
              <p className="max-w-xl text-base leading-relaxed text-foreground/75">{t("badge.body")}</p>
            </div>
            <div className="lg:order-1 lg:col-span-6">
              <div className="flex flex-col items-center gap-4 rounded border border-line bg-panel p-5 sm:p-8">
                <ol className="flex w-full flex-col gap-2">
                  {BADGE_LAYERS.map((layer, index) => (
                    <li
                      key={layer}
                      className="flex items-center justify-between rounded border border-line bg-background/60 px-4 py-3 font-mono text-xs tracking-widest uppercase"
                    >
                      <span className="text-foreground/75">{`0${index + 1}`}</span>
                      <span>{t(`badge.layers.${layer}`)}</span>
                    </li>
                  ))}
                </ol>
                <ArrowDown aria-hidden="true" className="size-6 text-foreground/60" strokeWidth={1.5} />
                <div className="flex size-36 flex-col items-center justify-center gap-2 rounded-full border-2 border-amber bg-background">
                  <SiteLogo className="size-8" />
                  <span className="font-mono text-xs font-bold tracking-widest uppercase">{shell("brand")}</span>
                  <ExampleTag>{t("inspector.example")}</ExampleTag>
                </div>
                <span className="text-center font-mono text-xs tracking-widest text-foreground/75 uppercase">
                  {t("badge.readout")}
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* 06 — TRADES */}
        <Section id="trades">
          <SectionLabel>{t("trades.label")}</SectionLabel>
          <h2 className="mb-10 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            <span className="block">{t("trades.titleLine1")}</span>
            <span className="block">{t("trades.titleLine2")}</span>
          </h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {LIVE_TRADES.map((trade) => {
              const Icon = LIVE_TRADE_ICONS[trade];
              return (
                <li key={trade}>
                  <Link
                    href={SIGN_UP_PATH}
                    className="flex h-full min-h-32 flex-col justify-between gap-6 rounded border border-foreground/30 bg-panel p-4 transition-colors hover:border-foreground/60"
                  >
                    <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
                    <span className="flex flex-col gap-1">
                      <span className="text-base font-bold">{t(`trades.names.${trade}`)}</span>
                      {/* "Verify now", never "LIVE" (#20): the trade is open, not a live feed. */}
                      <span className="flex items-center gap-1 font-mono text-xs font-bold tracking-wider text-amber uppercase">
                        {t("trades.verifyNow")}
                        <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
            {BENCH_TRADES.map((trade) => (
              // A plain readout: not a link, not a disabled button, full opacity (HANDOFF §5).
              <li
                key={trade}
                className="flex min-h-32 flex-col justify-between gap-6 rounded border border-line bg-panel/50 p-4"
              >
                <span className="font-mono text-xs tracking-widest text-foreground/60 uppercase">
                  {t("trades.comingSoon")}
                </span>
                <span className="font-mono text-sm text-foreground/75">{t(`trades.names.${trade}`)}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 07 — SCOPE */}
        <Section id="scope">
          <div className="mb-10 max-w-2xl">
            <SectionLabel>{t("scope.label")}</SectionLabel>
            <SectionTitle>{t("scope.title")}</SectionTitle>
            <p className="text-base leading-relaxed text-foreground/75">{t("scope.body")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded border border-line bg-panel p-5 sm:p-6">
              <h3 className="mb-4 font-mono text-xs font-bold tracking-widest uppercase">{t("scope.check")}</h3>
              <ul className="flex flex-col gap-3 text-sm">
                {SCOPE_CHECKS.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span aria-hidden="true">{glyphs("pass")}</span>
                    {t(`scope.checks.${item}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-line bg-panel p-5 sm:p-6">
              <h3 className="mb-4 font-mono text-xs font-bold tracking-widest text-foreground/75 uppercase">
                {t("scope.dontCheck")}
              </h3>
              <ul className="flex flex-col gap-3 text-sm text-foreground/75">
                {SCOPE_NOT_CHECKED.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span aria-hidden="true">{glyphs("no")}</span>
                    {t(`scope.notChecked.${item}`)}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-line pt-4 font-mono text-xs leading-relaxed text-foreground/75">
                {t("scope.certify")}
              </p>
            </div>
          </div>
        </Section>

        {/* 08 — NEXT */}
        <Section id="roadmap">
          <SectionLabel>{t("next.label")}</SectionLabel>
          <SectionTitle>{t("next.title")}</SectionTitle>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="relative aspect-video overflow-hidden rounded border border-line lg:col-span-6 lg:aspect-auto lg:min-h-72">
              <Image
                src={COOP_IMAGE}
                alt={t("next.imageAlt")}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover opacity-90 contrast-125 saturate-50"
              />
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-6">
              {NEXT_CARDS.map((card) => (
                // Coming-soon items are plain readouts at full opacity (HANDOFF §5).
                <li key={card} className="flex flex-col gap-3 rounded border border-line bg-panel p-5">
                  <span className="font-mono text-xs tracking-widest text-foreground/60 uppercase">{t("next.comingSoon")}</span>
                  <span className="text-sm font-semibold">{t(`next.cards.${card}.title`)}</span>
                  <span className="text-sm text-foreground/75">{t(`next.cards.${card}.body`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </StepProvider>
    </main>
  );
}
