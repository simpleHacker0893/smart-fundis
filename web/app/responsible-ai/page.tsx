import { ArrowRight, Eye, Equal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Section, SectionLabel, SectionTitle } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ResponsibleAi");
  return { title: t("meta.title"), description: t("meta.description") };
}

const STAGES = ["guard", "observe", "assess", "rules", "expert", "badge"] as const;
const DOES = ["1", "2", "3", "4"] as const;
const NEVER = ["1", "2", "3", "4", "5"] as const;
/** Caps rows whose result is "Needs review" carry the amber ◐. */
const CAPS = [
  { n: "1", review: true },
  { n: "2", review: true },
  { n: "3", review: false },
  { n: "4", review: true },
  { n: "5", review: false },
] as const;
/** `soon`: shipped in V4 (spec §9, cut list); drop the tag when it ships (HANDOFF C-6). */
const VIDEO_ROWS = [
  { key: "consent", soon: false },
  { key: "who", soon: false },
  { key: "public", soon: false },
  { key: "training", soon: false },
  { key: "gpu", soon: false },
  { key: "storage", soon: false },
  { key: "delete", soon: true },
  { key: "appeal", soon: true },
] as const;
const EVAL_STEPS = ["1", "2", "3", "4"] as const;
const EVAL_TRADES = ["electrical", "hairdressing"] as const;
const LIMITS = ["wrong", "handwriting", "sound", "links", "fallback", "badge"] as const;

function Tag({ children, tone = "dim" }: { children: string; tone?: "dim" | "amber" }) {
  return (
    <span
      className={`shrink-0 self-start rounded border px-2 py-0.5 font-mono text-xs tracking-widest uppercase ${
        tone === "amber" ? "border-amber/60 text-amber" : "border-line text-foreground/60"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * /responsible-ai (#26), from 18-responsible-ai-v3-responsive and prompt
 * 18-responsible-ai.md. The eval ledger stays "—" (no numbers until the
 * test has run), DELETE and APPEAL are "Coming soon" readouts, the
 * Kiswahili consent text is not printed, and only the hero has a photo.
 */
export default async function ResponsibleAiPage() {
  const [t, links, names, glyphs] = await Promise.all([
    getTranslations("ResponsibleAi"),
    getTranslations("Links"),
    getTranslations("Landing.trades.names"),
    getTranslations("Glyphs"),
  ]);

  return (
    <main className="flex w-full flex-1 flex-col">
      {/* Hero */}
      <Section id="top" className="film-grain py-12 sm:py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionLabel>{t("hero.label")}</SectionLabel>
            <h1 className="mb-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
            <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="#pipeline" className={pillClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
                {links("howVerdictMade")}
              </Link>
              <Link href="/privacy" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
                {links("privacy")}
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-7">
            <EvidenceFrame
              label={t("hero.frame")}
              tag={t("hero.frameTag")}
              src="/images/rai-hero-1200.webp"
              alt={t("hero.imageAlt")}
              markers={[t("hero.markers.1"), t("hero.markers.2"), t("hero.markers.3")]}
              priority
            />
            <div className="rounded border border-line bg-panel">
              <div className="flex justify-end border-b border-line px-4 py-2">
                <Tag>{t("example")}</Tag>
              </div>
              <dl className="divide-y divide-line text-sm">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("hero.ledger.safetyLabel")}</dt>
                  <dd>{t("hero.ledger.safety")}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("hero.ledger.verdictLabel")}</dt>
                  <dd className="flex items-center gap-2 text-amber">
                    <span aria-hidden="true">{glyphs("review")}</span>
                    {t("hero.ledger.verdict")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("hero.ledger.decisionLabel")}</dt>
                  <dd>{t("hero.ledger.decision")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </Section>

      {/* 01 — How a verdict is made */}
      <Section id="pipeline">
        <SectionLabel>{t("pipeline.label")}</SectionLabel>
        <SectionTitle>{t("pipeline.title")}</SectionTitle>
        <ol className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((stage) => (
            <li key={stage} className="flex flex-col gap-2 rounded border border-line bg-panel p-4">
              <span className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
                {t(`pipeline.stages.${stage}.tag`)}
              </span>
              <span className="font-bold">{t(`pipeline.stages.${stage}.title`)}</span>
              <span className="text-sm leading-relaxed text-foreground/75">{t(`pipeline.stages.${stage}.body`)}</span>
              {stage === "badge" && (
                <span aria-hidden="true" className="mt-auto flex size-8 items-center justify-center rounded-full border-2 border-amber text-amber">
                  {glyphs("pass")}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-foreground/75">{t("pipeline.caption")}</p>
      </Section>

      {/* 02 — What the AI never decides */}
      <Section id="never">
        <SectionLabel>{t("never.label")}</SectionLabel>
        <SectionTitle>{t("never.title")}</SectionTitle>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border border-line bg-panel">
            <h3 className="border-b border-line px-5 py-3 font-mono text-xs font-bold tracking-widest uppercase">{t("never.does")}</h3>
            <ul className="divide-y divide-line text-sm">
              {DOES.map((n) => (
                <li key={n} className="flex gap-3 px-5 py-3">
                  <span aria-hidden="true">{glyphs("pass")}</span>
                  {t(`never.doesItems.${n}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-line bg-panel">
            <h3 className="border-b border-line px-5 py-3 font-mono text-xs font-bold tracking-widest uppercase">{t("never.doesNot")}</h3>
            <ul className="divide-y divide-line text-sm">
              {NEVER.map((n) => (
                <li key={n} className="flex gap-3 px-5 py-3">
                  <span aria-hidden="true">{t("never.dash")}</span>
                  {t(`never.neverItems.${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded border border-line bg-panel p-5 sm:flex-row sm:items-center">
          <Tag>{t("never.ruleTag")}</Tag>
          <p className="text-sm">{t("never.rule")}</p>
        </div>
      </Section>

      {/* 03 — Safety caps */}
      <Section id="caps">
        <SectionLabel>{t("caps.label")}</SectionLabel>
        <SectionTitle>{t("caps.title")}</SectionTitle>
        <p className="mb-8 max-w-2xl text-base text-foreground/75">{t("caps.intro")}</p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="overflow-hidden rounded border border-line bg-panel lg:col-span-8">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-3 font-bold">{t("caps.colIf")}</th>
                  <th scope="col" className="px-4 py-3 font-bold">{t("caps.colThen")}</th>
                  <th scope="col" className="hidden px-4 py-3 font-bold md:table-cell">{t("caps.colWhy")}</th>
                </tr>
              </thead>
              <tbody>
                {CAPS.map((row) => (
                  <tr key={row.n} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-4 py-3 align-top font-normal">{t(`caps.rows.${row.n}.if`)}</th>
                    <td className={`px-4 py-3 align-top font-mono text-xs ${row.review ? "text-amber" : ""}`}>
                      {row.review && <span aria-hidden="true">{`${glyphs("review")} `}</span>}
                      {t(`caps.rows.${row.n}.then`)}
                    </td>
                    <td className="hidden px-4 py-3 align-top text-foreground/75 md:table-cell">{t(`caps.rows.${row.n}.why`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 rounded border border-line bg-panel p-5 lg:col-span-4">
            <Tag>{t("caps.paperTag")}</Tag>
            <p className="text-sm">{t("caps.paper1")}</p>
            <p className="text-sm text-foreground/75">{t("caps.paper2")}</p>
            {/* Line diagram: paper code → read blind → compared in code. */}
            <div className="mt-2 flex items-center justify-between gap-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">
              <span aria-hidden="true" className="flex gap-1 rounded border border-foreground/40 p-1.5">
                <span className="size-4 border border-foreground/40" />
                <span className="size-4 border border-foreground/40" />
                <span className="size-4 border border-foreground/40" />
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="flex flex-col items-center gap-1 text-center">
                <Eye aria-hidden="true" className="size-5" strokeWidth={1.5} />
                {t("caps.readBlind")}
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="flex flex-col items-center gap-1 text-center">
                <Equal aria-hidden="true" className="size-5" strokeWidth={1.5} />
                {t("caps.compared")}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* 04 — Consent and your video */}
      <Section id="video">
        <SectionLabel>{t("video.label")}</SectionLabel>
        <SectionTitle>{t("video.title")}</SectionTitle>
        <dl className="mt-8 grid grid-cols-1 gap-x-8 border-t border-line md:grid-cols-2">
          {VIDEO_ROWS.map((row) => (
            <div key={row.key} data-row={row.key} className="flex items-start justify-between gap-4 border-b border-line py-4">
              <dt className="w-32 shrink-0 font-mono text-xs font-bold tracking-widest uppercase">{t(`video.rows.${row.key}.label`)}</dt>
              <dd className="flex flex-1 flex-col items-start gap-2 text-sm text-foreground/80 sm:flex-row sm:justify-between sm:gap-3">
                {t(`video.rows.${row.key}.value`)}
                {row.soon && <Tag>{t("comingSoon")}</Tag>}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["traces", "showcase"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-3 rounded border border-line bg-panel p-5">
              <Tag>{t(`video.${key}Tag`)}</Tag>
              <p className="text-sm">{t(`video.${key}`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 05 — How we test */}
      <Section id="eval">
        <SectionLabel>{t("eval.label")}</SectionLabel>
        <SectionTitle>{t("eval.title")}</SectionTitle>
        <ol className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {EVAL_STEPS.map((n) => (
            <li key={n} className="flex flex-col gap-2 rounded border border-line bg-panel p-4">
              <span className="font-mono text-xs font-bold tracking-widest uppercase">{t(`eval.steps.${n}.tag`)}</span>
              <span className="text-sm text-foreground/75">{t(`eval.steps.${n}.body`)}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded border border-line bg-panel">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 font-mono text-xs tracking-widest uppercase">
            <span>{t("eval.results")}</span>
            <Tag>{t("eval.resultsTag")}</Tag>
          </div>
          {/* Desktop and tablet: the ledger. Mobile: one card per row (no horizontal scroll). */}
          <table className="hidden w-full border-collapse text-left text-sm md:table">
            <thead className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
              <tr className="border-b border-line">
                {(["colModel", "colTrade", "colAgreement", "colRecall", "colSplit"] as const).map((col) => (
                  <th key={col} scope="col" className="px-4 py-3 font-bold">{t(`eval.${col}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EVAL_TRADES.map((trade) => (
                <tr key={trade} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-mono font-normal">{t("eval.model")}</th>
                  <td className="px-4 py-3">{names(trade)}</td>
                  <td data-metric="agreement" className="px-4 py-3 font-mono">{t("eval.dash")}</td>
                  <td data-metric="recall" className="px-4 py-3 font-mono">{t("eval.dash")}</td>
                  <td className="px-4 py-3 text-foreground/75">{t("eval.split")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">
            {EVAL_TRADES.map((trade) => (
              <li key={trade} className="px-4 py-3">
                <p className="font-mono text-sm">{t("eval.model")}</p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-foreground/75">{t("eval.colTrade")}</dt>
                  <dd>{names(trade)}</dd>
                  <dt className="text-foreground/75">{t("eval.colAgreement")}</dt>
                  <dd data-metric="agreement" className="font-mono">{t("eval.dash")}</dd>
                  <dt className="text-foreground/75">{t("eval.colRecall")}</dt>
                  <dd data-metric="recall" className="font-mono">{t("eval.dash")}</dd>
                  <dt className="text-foreground/75">{t("eval.colSplit")}</dt>
                  <dd>{t("eval.split")}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-sm font-semibold">{t("eval.noNumbers")}</p>
      </Section>

      {/* 06 — Limits and known risks */}
      <Section id="limits">
        <SectionLabel>{t("limits.label")}</SectionLabel>
        <SectionTitle>{t("limits.title")}</SectionTitle>
        <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {LIMITS.map((key) => (
            <li key={key} className="flex flex-col gap-2 rounded border border-line bg-panel p-5">
              <span className="font-mono text-xs font-bold tracking-widest uppercase">{t(`limits.items.${key}.tag`)}</span>
              <span className="text-sm text-foreground/75">{t(`limits.items.${key}.body`)}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 07 — Contact */}
      <Section id="contact">
        <SectionLabel>{t("contact.label")}</SectionLabel>
        <div className="mt-4 grid grid-cols-1 gap-6 rounded border border-line bg-panel p-6 sm:p-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("contact.title")}</p>
            <p className="text-sm text-foreground/75">{t("contact.body")}</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:col-span-5">
            {CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`} className={pillClass({ variant: "secondary", size: "full", className: "sm:w-auto" })}>
                {t("contact.email")}
              </a>
            ) : (
              <p className="text-sm text-foreground/75">{t("contact.pending")}</p>
            )}
            <Link href="/evidence" className="inline-flex min-h-12 items-center text-sm text-foreground/75 underline-offset-4 hover:text-foreground hover:underline">
              {t("contact.evidence")}
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
