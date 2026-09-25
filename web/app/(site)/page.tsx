import { ArrowDown, ArrowRight, TriangleAlert, Video, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeroCtas } from "@/components/landing/hero-ctas";
import { ScopeLedgers } from "@/components/landing/scope-ledgers";
import { ExampleTag, Section, SectionLabel, SectionTitle, Tag } from "@/components/landing/section";
import { Ledger, StepInspector, StepProvider } from "@/components/landing/step-inspector";
import { SiteLogo } from "@/components/site-logo";
import { BADGE_LAYERS, NEXT_CARDS } from "@/lib/landing";
import { JOIN_EXPERT_PATH } from "@/lib/site-nav";
import { BENCH_TRADES, OPEN_TRADES, verifyHref } from "@/lib/trades";

const HERO_IMAGE = "/images/landing-socket-wiring-1280.webp";
const COOP_IMAGE = "/images/landing-coop-bench-1280.webp";

/**
 * The landing page, rebuilt from the Stitch screen "Smart Fundis — Kazi yako,
 * sifa yako (Responsive Web App)" (design/stitch/exports/01-landing-v3-responsive),
 * with the copy of prompt 01-landing.md (the prompt wins over the export's
 * text; HANDOFF §1) and the honesty fixes of HANDOFF §5–6: every sample says
 * EXAMPLE, nothing claims to be live, ticks are white, no invented readouts.
 * The hero line stays in Kiswahili (lang="sw") with English after it; it is
 * the only Kiswahili on the site besides consent (Architect ruling).
 */
export default async function HomePage() {
  const [t, links, glyphs, shell, common] = await Promise.all([
    getTranslations("Landing"),
    getTranslations("Links"),
    getTranslations("Glyphs"),
    getTranslations("Shell"),
    getTranslations("Common"),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <StepProvider>
        {/* 01 — PROOF OF SKILL */}
        <Section id="evidence" className="film-grain py-12 sm:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col lg:col-span-5">
              <SectionLabel>{t("hero.label")}</SectionLabel>
              <h1 className="mb-4 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                <span lang="sw">
                  <span className="block">{t("hero.titleLine1")}</span>
                  <span className="block">{t("hero.titleLine2")}</span>
                </span>
              </h1>
              <p className="mb-3 text-xl font-semibold tracking-tight">{t("hero.english")}</p>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
              <HeroCtas />
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
                  <span>{t("record.panel")}</span>
                  <ExampleTag>{common("example")}</ExampleTag>
                </div>
                <div className="flex flex-col items-center py-10">
                  <span className="font-mono text-7xl font-bold tracking-[0.2em] sm:text-8xl">{t("record.code")}</span>
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
                  <span className="self-center">
                    <ExampleTag>{common("example")}</ExampleTag>
                  </span>
                </div>
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
            {OPEN_TRADES.map(({ slug, icon: Icon }) => (
              <li key={slug}>
                <Link
                  href={verifyHref(slug)}
                  className="flex h-full min-h-32 flex-col justify-between gap-6 rounded border border-foreground/30 bg-panel p-4 transition-colors hover:border-foreground/60"
                >
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-bold">{t(`trades.names.${slug}`)}</span>
                    {/* "Verify now", never "LIVE" (#20): the trade is open, not a live feed. */}
                    <span className="flex items-center gap-1 font-mono text-xs font-bold tracking-wider text-amber uppercase">
                      {t("trades.verifyNow")}
                      <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {BENCH_TRADES.map(({ slug }) => (
              // A plain readout: not a link, not a disabled button, full opacity (HANDOFF §5).
              <li key={slug} className="flex min-h-32 flex-col justify-between gap-6 rounded border border-line bg-panel/50 p-4">
                <span className="font-mono text-xs tracking-widest text-foreground/60 uppercase">{common("comingSoon")}</span>
                <span className="font-mono text-sm text-foreground/75">{t(`trades.names.${slug}`)}</span>
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
          <ScopeLedgers />
          {/* Spec §8: the trust section invites Experts (/join?role=expert says "Coming soon" until V4). */}
          <Link
            href={JOIN_EXPERT_PATH}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-5 text-sm transition-colors hover:border-foreground/40"
          >
            {links("becomeVerifier")}
            <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
          </Link>
        </Section>

        {/* 08 — NEXT */}
        <Section id="roadmap">
          <SectionLabel>{t("next.label")}</SectionLabel>
          <SectionTitle>{t("next.title")}</SectionTitle>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="relative aspect-video overflow-hidden rounded border border-line lg:col-span-6 lg:aspect-auto lg:min-h-72">
              {/* The Canva/Stitch photo carries v1 colour; desaturate to about 20% (HANDOFF §4). */}
              <Image
                src={COOP_IMAGE}
                alt={t("next.imageAlt")}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover opacity-90 contrast-125 saturate-20"
              />
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-6">
              {NEXT_CARDS.map((card) => (
                // Coming-soon items are plain readouts at full opacity (HANDOFF §5).
                <li key={card} className="flex flex-col gap-3 rounded border border-line bg-panel p-5">
                  <Tag>{common("comingSoon")}</Tag>
                  <span className="text-sm font-semibold">{t(`next.cards.${card}.title`)}</span>
                  <span className="text-sm text-foreground/75">{t(`next.cards.${card}.body`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* 09 — Show your work: the CTA band that left the footer (#27). */}
        <Section id="join" className="border-b-0 py-20 lg:py-28">
          <div className="flex flex-col items-center text-center">
            <SectionLabel>{t("seal.label")}</SectionLabel>
            <h2 className="mb-8 text-4xl font-black tracking-tight uppercase sm:text-6xl lg:text-7xl">{t("seal.title")}</h2>
            <HeroCtas className="w-full sm:w-auto" />
          </div>
        </Section>
      </StepProvider>
    </main>
  );
}
