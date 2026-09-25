import { ArrowDown, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Section, SectionLabel } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { SIGN_UP_PATH } from "@/lib/auth-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return { title: t("meta.title"), description: t("meta.description") };
}

const WHAT = ["are", "not", "notYet"] as const;
const PRINCIPLES = ["1", "2", "3", "4"] as const;
const MORE = [
  { key: "telemetry", href: "/telemetry" },
  { key: "roadmap", href: "/#roadmap" },
  { key: "contact", href: "/contact" },
] as const;

/**
 * /about (#24), from 05-about-responsive with prompt 05-about.md copy.
 * Honesty fixes over the export: no "FPS: 30", "continuous telemetry",
 * "fresh telemetry", "trade verified" or "verification seal" readouts; the
 * fourth principle says what the rule really is.
 */
export default async function AboutPage() {
  const [t, links] = await Promise.all([getTranslations("About"), getTranslations("Links")]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <Section id="top" className="film-grain py-12 sm:py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel>{t("hero.label")}</SectionLabel>
            <h1 className="mb-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
            <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href={SIGN_UP_PATH} className={pillClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
                {links("joinAsFundi")}
              </Link>
              <Link href="#what" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
                {t("hero.secondary")}
                <ArrowDown aria-hidden="true" className="ml-2 size-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <EvidenceFrame
              label={t("hero.frame")}
              tag={t("hero.frameTag")}
              src="/images/sf-plumbing-bench-1280.webp"
              alt={t("hero.imageAlt")}
              aspect="aspect-video"
              priority
            />
          </div>
        </div>
      </Section>

      <Section id="what">
        <SectionLabel>{t("what.label")}</SectionLabel>
        <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {WHAT.map((key) => (
            <li key={key} className="flex flex-col gap-3 rounded border border-line bg-panel p-5">
              <span className="flex items-center justify-between gap-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">
                {t(`what.${key}.tag`)}
                {key === "notYet" && (
                  <span className="rounded border border-line px-2 py-0.5 text-foreground/60">{t("comingSoon")}</span>
                )}
              </span>
              <span className="text-lg font-bold tracking-tight">{t(`what.${key}.title`)}</span>
              <span className="mt-auto border-t border-line pt-3 font-mono text-xs leading-relaxed text-foreground/75">
                {t(`what.${key}.body`)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="principles">
        <SectionLabel>{t("principles.label")}</SectionLabel>
        <ol className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {PRINCIPLES.map((n) => (
            <li key={n} className="flex gap-4 rounded border border-line bg-panel p-5">
              <span className="font-mono text-sm font-bold text-amber">{`0${n}`}</span>
              <span className="flex flex-col gap-1">
                <span className="font-bold">{t(`principles.items.${n}.title`)}</span>
                <span className="text-sm text-foreground/75">{t(`principles.items.${n}.body`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="statement">
        <SectionLabel>{t("statement.label")}</SectionLabel>
        <div className="mt-6 grid grid-cols-1 items-center gap-8 rounded border border-line bg-panel p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">{t("statement.title")}</p>
            <p className="max-w-xl text-base leading-relaxed text-foreground/75">{t("statement.body")}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded border border-line">
            <Image
              src="/images/sf-hands-wrench-1280.webp"
              alt={t("statement.imageAlt")}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover opacity-90 contrast-125 grayscale"
            />
          </div>
        </div>
      </Section>

      <Section id="more">
        <h2 className="sr-only">{t("more.label")}</h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {MORE.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex h-full items-center justify-between gap-4 rounded border border-line bg-panel p-5 transition-colors hover:border-foreground/40"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{t(`more.${item.key}.title`)}</span>
                  <span className="font-mono text-xs text-foreground/75">{t(`more.${item.key}.body`)}</span>
                </span>
                <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-foreground/60" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
