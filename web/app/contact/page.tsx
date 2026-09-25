import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Section, SectionLabel } from "@/components/landing/section";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * /contact (#24), from 06-contact-v3-responsive with prompt 06 copy.
 * The form must not look live: with no message backend it composes an
 * email (mailto) to the one contact address, and until that address is
 * chosen (lib/contact.ts) the page shows a plain readout instead of a form.
 * Dropped from the export: "channel open", "direct ingress" and the
 * team@example.com placeholder.
 */
export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <main className="flex w-full flex-1 flex-col">
      <Section id="top" className="film-grain py-12 sm:py-16">
        <SectionLabel>{t("hero.label")}</SectionLabel>
        <h1 className="mb-4 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl">{t("hero.title")}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-foreground/75">{t("hero.body")}</p>
      </Section>

      <Section id="write">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {CONTACT_EMAIL && (
            <div>
              <SectionLabel>{t("message.label")}</SectionLabel>
              <ContactForm to={CONTACT_EMAIL} />
            </div>
          )}
          <div className="flex flex-col gap-4">
            <SectionLabel>{t("direct.label")}</SectionLabel>
            <EvidenceFrame
              label={t("direct.frame")}
              tag={t("direct.frameTag")}
              src="/images/sf-phone-in-hand-1280.webp"
              alt={t("direct.imageAlt")}
              aspect="aspect-video"
            />
            <div className="rounded border border-line bg-panel p-5">
              <p className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("direct.email")}</p>
              {CONTACT_EMAIL ? (
                <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 inline-flex min-h-12 items-center font-mono text-base">
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <p className="mt-1 text-sm text-foreground/75">{t("direct.pending")}</p>
              )}
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
