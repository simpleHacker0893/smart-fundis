import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { HeroCtas } from "@/components/landing/hero-ctas";
import { PageHero } from "@/components/landing/page-hero";
import { ScopeLedgers } from "@/components/landing/scope-ledgers";
import { ExampleTag, Section, SectionLabel, SectionTitle } from "@/components/landing/section";

const CHAIN = ["consent", "code", "video", "ai", "expert"] as const;
const MARKERS = ["1", "2", "3"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Evidence");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * /evidence — how verification works and what "verified" means (#21).
 * Built from design/stitch/exports/02-evidence-responsive (desktop) and
 * 02-evidence-mobile, with prompt 02-evidence.md copy. Honesty fixes over
 * the export: no "100% passed steps", reviewer numbers, "ACTIVE" chips,
 * verified location or "Contact fundi" button; every sample says EXAMPLE.
 */
export default async function EvidencePage() {
  const [t, landing, glyphs, common] = await Promise.all([
    getTranslations("Evidence"),
    getTranslations("Landing"),
    getTranslations("Glyphs"),
    getTranslations("Common"),
  ]);
  const example = common("example");

  return (
    <main className="flex w-full flex-1 flex-col">
      <PageHero
        label={t("hero.label")}
        title={t("hero.title")}
        body={t("hero.body")}
        actions={<HeroCtas />}
        asideWide
        aside={
          <EvidenceFrame
            label={t("hero.frame")}
            tag={t("hero.frameTag")}
            src="/images/sf-braiding-hands-1280.webp"
            alt={t("hero.imageAlt")}
            markers={MARKERS.map((m) => t(`hero.markers.${m}`))}
            priority
          />
        }
      />

      {/* 01 — The chain of evidence */}
      <Section id="chain">
        <SectionLabel>{t("chain.label")}</SectionLabel>
        <SectionTitle>{t("chain.title")}</SectionTitle>
        <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CHAIN.map((step, index) => (
            <li key={step} className="relative flex flex-col gap-3 rounded border border-line bg-panel p-5">
              <span className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
                {t("chain.step", { n: `0${index + 1}` })}
              </span>
              <span className="font-mono text-sm font-bold tracking-widest uppercase">
                {t(`chain.steps.${step}.title`)}
              </span>
              <span className="text-sm leading-relaxed text-foreground/75">{t(`chain.steps.${step}.body`)}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* 02 — What a badge says */}
      <Section id="badge">
        <SectionLabel>{t("badge.label")}</SectionLabel>
        <SectionTitle>{t("badge.title")}</SectionTitle>
        <div className="mt-8 grid grid-cols-1 gap-6 rounded border border-line bg-panel p-4 sm:p-6 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <ExampleTag>{example}</ExampleTag>
            <div className="rounded border border-line bg-background/60 p-5">
              <p className="flex items-center gap-2 text-base font-semibold">
                <span aria-hidden="true">{glyphs("pass")}</span>
                {t("badge.verified")}
              </p>
              <p className="mt-1 font-mono text-sm text-amber">{t("badge.task")}</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/75">{t("badge.body")}</p>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["reviewer", "video"] as const).map((key) => (
                <div key={key} className="rounded border border-line bg-background/60 p-4">
                  <dt className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t(`badge.${key}Label`)}</dt>
                  <dd className="mt-1 font-mono text-sm">{t(`badge.${key}`)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded border border-line lg:col-span-5 lg:aspect-auto">
            <Image
              src="/images/sf-socket-terminal-1280.webp"
              alt={t("badge.imageAlt")}
              fill
              sizes="(min-width: 1024px) 460px, 100vw"
              className="object-cover opacity-90 contrast-125 grayscale"
            />
          </div>
        </div>
      </Section>

      {/* 03 — A public profile */}
      <Section id="profile">
        <SectionLabel>{t("profile.label")}</SectionLabel>
        <SectionTitle>{t("profile.title")}</SectionTitle>
        <div className="mt-8 grid grid-cols-1 gap-6 rounded border border-line bg-panel p-4 sm:p-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{t("profile.name")}</p>
                <p className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("profile.county")}</p>
              </div>
              <ExampleTag>{example}</ExampleTag>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded border border-line">
              <Image
                src="/images/sf-panel-wiring-1280.webp"
                alt={t("profile.imageAlt")}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover opacity-90 contrast-125 grayscale"
              />
            </div>
            <p className="rounded border border-line bg-background/60 p-4 font-mono text-xs leading-relaxed text-foreground/75">
              {t("profile.private")}
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("profile.facts")}</h3>
              <dl className="divide-y divide-line border-y border-line text-sm">
                {(["trades", "experience", "languages"] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between py-3">
                    <dt className="text-foreground/75">{t(`profile.${key}Label`)}</dt>
                    <dd className="font-mono">{t(`profile.${key}`)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="mb-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("profile.badges")}</h3>
              <div className="flex items-start gap-3 rounded border border-line bg-background/60 p-4">
                <span aria-hidden="true">{glyphs("pass")}</span>
                <div>
                  <p className="text-sm font-semibold">{t("profile.badgeTask")}</p>
                  <p className="font-mono text-xs text-foreground/75">{t("profile.badgeDate")}</p>
                </div>
              </div>
            </div>
            {/* A readout, not a link: showcase media is never verified (ADR-7). */}
            <p className="rounded border border-dashed border-line p-4 font-mono text-xs tracking-wider text-foreground/75 uppercase">
              {t("profile.showcase")}
            </p>
          </div>
        </div>
      </Section>

      {/* 04 — Scope */}
      <Section id="scope">
        <div className="mb-10 max-w-2xl">
          <SectionLabel>{t("scope.label")}</SectionLabel>
          <SectionTitle>{landing("scope.title")}</SectionTitle>
          <p className="text-base leading-relaxed text-foreground/75">{landing("scope.body")}</p>
        </div>
        <ScopeLedgers />
      </Section>
    </main>
  );
}
