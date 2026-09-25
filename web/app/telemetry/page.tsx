import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Section, SectionLabel, SectionTitle } from "@/components/landing/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Telemetry");
  return { title: t("meta.title"), description: t("meta.description") };
}

const STAGES = ["ingest", "guard", "observe", "assess", "rules", "expert"] as const;
const OUTPUTS = ["pass", "review", "reshoot"] as const;
/** Privacy rows; `soon` rows describe features that ship in V4 (spec §9). */
const PRIVACY_ROWS = [
  { key: "who", soon: false },
  { key: "training", soon: false },
  { key: "delete", soon: true },
  { key: "traces", soon: false },
] as const;

function SoonTag({ children }: { children: string }) {
  return (
    <span className="shrink-0 self-start rounded border border-line px-2 py-0.5 font-mono text-xs tracking-widest text-foreground/60 uppercase">
      {children}
    </span>
  );
}

/**
 * /telemetry — how the AI works (Responsible AI), #23. From
 * 04-telemetry-v3-responsive with prompt 04-telemetry.md copy and spec §7.
 * Honesty fixes over the export: no "100% Human Panel", "isolated GPU",
 * "enclave", "cryptographic" or "hardware tethered" readouts; deletion and
 * appeals are tagged "Coming soon" until V4 ships them (HANDOFF C-6).
 */
export default async function TelemetryPage() {
  const t = await getTranslations("Telemetry");

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
            <p className="max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
          </div>
          <div className="lg:col-span-5">
            <figure className="rounded border border-line bg-panel p-5 sm:p-6">
              <p className="mb-3 flex items-center gap-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">
                <span aria-hidden="true" className="size-2 rotate-45 bg-amber" />
                {t("hero.principle")}
              </p>
              <blockquote className="font-mono text-sm leading-relaxed">{t("hero.quote")}</blockquote>
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
                {(["decides", "runs"] as const).map((key) => (
                  <div key={key}>
                    <dt className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t(`hero.${key}Label`)}</dt>
                    <dd className="mt-1 text-sm font-semibold">{t(`hero.${key}`)}</dd>
                  </div>
                ))}
              </dl>
            </figure>
          </div>
        </div>
      </Section>

      <Section id="pipeline">
        <SectionLabel>{t("pipeline.label")}</SectionLabel>
        <SectionTitle>{t("pipeline.title")}</SectionTitle>
        <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {STAGES.map((stage, index) => {
            const gate = stage === "rules";
            return (
              <li
                key={stage}
                className={`flex flex-col gap-2 rounded border bg-panel p-4 ${gate ? "border-amber/60" : "border-line"}`}
              >
                <span className="flex items-center justify-between font-mono text-xs tracking-widest text-foreground/75 uppercase">
                  {t("pipeline.stage", { n: `0${index + 1}` })}
                  {gate && <span className="text-amber">{t("pipeline.gate")}</span>}
                </span>
                <span className="font-mono text-sm font-bold tracking-widest uppercase">{t(`pipeline.stages.${stage}.title`)}</span>
                <span className="text-sm leading-relaxed text-foreground/75">{t(`pipeline.stages.${stage}.body`)}</span>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section id="outputs">
        <SectionLabel>{t("outputs.label")}</SectionLabel>
        <SectionTitle>{t("outputs.title")}</SectionTitle>
        <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {OUTPUTS.map((out) => {
            const review = out === "review";
            return (
              <li
                key={out}
                className={`flex flex-col gap-4 rounded border bg-panel p-5 ${review ? "border-amber/60" : "border-line"}`}
              >
                <span className={`flex items-center gap-2 text-base font-semibold ${review ? "text-amber" : ""}`}>
                  <span aria-hidden="true">{t(`outputs.${out}.glyph`)}</span>
                  {t(`outputs.${out}.title`)}
                </span>
                <span className="rounded border border-line bg-background/60 px-3 py-2 text-center font-mono text-xs">
                  {t(`outputs.${out}.result`)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 border-l-2 border-foreground/40 bg-panel px-5 py-4 font-mono text-sm">{t("outputs.caption")}</p>
      </Section>

      <Section id="privacy">
        <SectionLabel>{t("privacy.label")}</SectionLabel>
        <SectionTitle>{t("privacy.title")}</SectionTitle>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EvidenceFrame
            label={t("privacy.frame")}
            tag={t("privacy.frameTag")}
            src="/images/sf-phone-recording-1280.webp"
            alt={t("privacy.imageAlt")}
            aspect="aspect-video"
          />
          <ul className="flex flex-col gap-3">
            {PRIVACY_ROWS.map((row) => (
              <li key={row.key} className="flex items-start justify-between gap-4 rounded border border-line bg-panel p-4">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest uppercase">{t(`privacy.rows.${row.key}.label`)}</p>
                  <p className="mt-1 text-sm text-foreground/75">{t(`privacy.rows.${row.key}.value`)}</p>
                </div>
                {row.soon && <SoonTag>{t("comingSoon")}</SoonTag>}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="appeals">
        <SectionLabel>{t("appeals.label")}</SectionLabel>
        <div className="mt-4 flex flex-col gap-4 rounded border border-line bg-panel p-6 sm:p-8">
          <SoonTag>{t("comingSoon")}</SoonTag>
          <p className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">{t("appeals.title")}</p>
        </div>
      </Section>
    </main>
  );
}
