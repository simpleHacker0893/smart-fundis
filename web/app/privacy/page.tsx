import { Eye, Lock, ShieldCheck, Trash2, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Section, SectionLabel } from "@/components/landing/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return { title: t("meta.title"), description: t("meta.description") };
}

const WHO_ROWS = [
  { key: "video", public: false },
  { key: "feedback", public: false },
  { key: "contact", public: false },
  { key: "badge", public: true },
  { key: "showcase", public: true },
] as const;

// Deletion is left out here until it ships; the Delete control says "Coming soon".
const CONSENT_POINTS = ["who", "badge", "training"] as const;

/** `soon`: the control ships later (delete in V4, the visibility toggle with the Fundi dashboard). */
const CONTROLS: { key: "delete" | "training" | "visibility"; icon: LucideIcon; soon: boolean }[] = [
  { key: "delete", icon: Trash2, soon: true },
  { key: "training", icon: ShieldCheck, soon: false },
  { key: "visibility", icon: Eye, soon: true },
];

/**
 * /privacy (#25). The operator keeps the Stitch mockup's design
 * (10-privacy-v3-responsive); the copy follows the product (PRD §8,
 * spec §7):
 * - AI feedback is also seen by the reviewing Expert and Admins.
 * - No Kiswahili consent text is printed (HANDOFF §5, C-6): the consent card
 *   says what the consent covers, and that it is asked in both languages.
 * - Delete and the visibility toggle are tagged "Coming soon".
 * - Dropped: "cold storage", "hardware local buffer", "FPS", "sovereignty",
 *   "zero harvest", "on-demand purge" and "SPEC //" readouts.
 */
export default async function PrivacyPage() {
  const [t, glyphs] = await Promise.all([getTranslations("Privacy"), getTranslations("Glyphs")]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <Section id="top" className="film-grain py-12 sm:py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel>{t("hero.label")}</SectionLabel>
            <h1 className="mb-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl">{t("hero.title")}</h1>
            <p className="max-w-xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
          </div>
          <div className="lg:col-span-5">
            <EvidenceFrame
              label={t("hero.frame")}
              tag={t("hero.frameTag")}
              src="/images/sf-phone-on-bench-1280.webp"
              alt={t("hero.imageAlt")}
              aspect="aspect-video"
              sizes="(min-width: 1024px) 480px, 100vw"
              priority
            />
          </div>
        </div>
      </Section>

      <Section id="who">
        <SectionLabel>{t("who.label")}</SectionLabel>
        <div className="mt-6 overflow-hidden rounded border border-line bg-panel">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 font-bold">{t("who.colItem")}</th>
                <th scope="col" className="px-4 py-3 font-bold">{t("who.colWho")}</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">{t("who.colPublic")}</th>
              </tr>
            </thead>
            <tbody>
              {WHO_ROWS.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b border-line last:border-b-0 ${row.key === "badge" ? "bg-foreground/5" : ""}`}
                >
                  <th scope="row" className={`px-4 py-4 font-mono font-bold ${row.key === "badge" ? "text-amber" : ""}`}>
                    {t(`who.rows.${row.key}.item`)}
                  </th>
                  <td className="px-4 py-4 font-mono text-foreground/80">{t(`who.rows.${row.key}.who`)}</td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 font-mono text-xs ${
                        row.public ? "border-amber/60 text-amber" : "border-line text-foreground/75"
                      }`}
                    >
                      {row.public ? t("who.yes") : t("who.no")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="consent">
        <SectionLabel>{t("consent.label")}</SectionLabel>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border border-line bg-panel p-5 sm:p-6">
            <h2 className="mb-4 font-mono text-xs font-bold tracking-widest text-amber uppercase">{t("consent.what")}</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {CONSENT_POINTS.map((point) => (
                <li key={point} className="flex gap-3">
                  <span aria-hidden="true">{glyphs("pass")}</span>
                  {t(`consent.points.${point}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-line bg-panel p-5 sm:p-6">
            <h2 className="mb-4 font-mono text-xs font-bold tracking-widest text-amber uppercase">{t("consent.how")}</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {(["languages", "gate", "coop"] as const).map((key) => (
                <li key={key} className="flex gap-3">
                  <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground/60" strokeWidth={1.5} />
                  {t(`consent.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section id="controls">
        <SectionLabel>{t("controls.label")}</SectionLabel>
        <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {CONTROLS.map(({ key, icon: Icon, soon }) => (
            // Readouts, not buttons: the controls live in the Fundi dashboard.
            <li key={key} className="flex flex-col gap-4 rounded border border-line bg-panel p-5">
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-amber uppercase">
                  {t(`controls.${key}.label`)}
                </span>
                <Icon aria-hidden="true" className="size-5 text-foreground/60" strokeWidth={1.5} />
              </span>
              <span className="text-sm">{t(`controls.${key}.body`)}</span>
              {soon && (
                <span className="self-start rounded border border-line px-2 py-0.5 font-mono text-xs tracking-widest text-foreground/60 uppercase">
                  {t("comingSoon")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
