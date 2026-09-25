import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { PageHero } from "@/components/landing/page-hero";
import { Section, SectionLabel } from "@/components/landing/section";
import { CONTACT_EMAIL } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * /contact (#24), from 06-contact-v3-responsive with prompt 06 copy.
 * The form must not look live: with no message backend (#29 adds one) it
 * composes an email (mailto) to the one contact address in lib/contact.ts.
 * Dropped from the export: "channel open", "direct ingress" and the
 * team@example.com placeholder.
 */
export default async function ContactPage() {
  const [t, common] = await Promise.all([getTranslations("Contact"), getTranslations("Common")]);

  return (
    <main className="flex w-full flex-1 flex-col">
      <PageHero label={t("hero.label")} title={t("hero.title")} body={t("hero.body")} />

      <Section id="write">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <SectionLabel>{t("message.label")}</SectionLabel>
            <ContactForm to={CONTACT_EMAIL} />
          </div>
          <div className="flex flex-col gap-4">
            <SectionLabel>{t("direct.label")}</SectionLabel>
            <EvidenceFrame
              label={t("direct.frame")}
              tag={common("example")}
              src="/images/sf-phone-in-hand-1280.webp"
              alt={t("direct.imageAlt")}
              aspect="aspect-video"
            />
            <div className="rounded border border-line bg-panel p-5">
              <p className="font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("direct.email")}</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 inline-flex min-h-12 items-center font-mono text-base">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
