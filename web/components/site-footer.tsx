import { getTranslations } from "next-intl/server";
import { FooterLink } from "@/components/footer-link";
import { CONTACT_EMAIL } from "@/lib/contact";
import { builtOnly, FOOTER_GROUPS } from "@/lib/site-nav";

type FooterLinkItem = (typeof FOOTER_GROUPS)[number]["links"][number];

/**
 * The compact site footer (#27, operator's brief): one 1 px top border,
 * four columns (FOR FUNDIS · FOR CLIENTS · FOR EXPERTS · COMPANY), each a
 * <nav> labelled by its heading, then the legal line and the one contact
 * email. No wordmark and
 * no CTA band (the band is landing section 09).
 * - Headings: 12 px mono, uppercase, 0.15em, amber (amber #ef9a57, D-9).
 * - Links: 13 px, light grey, white on hover; the current page is white with
 *   an amber underline (FooterLink).
 * - 2 columns below 1024 px (a 2×2 grid), 4 from 1024 px; text keeps its
 *   size on mobile.
 * Links to pages that don't exist yet are left out, and so is an emptied
 * column.
 */
export async function SiteFooter() {
  const [t, links] = await Promise.all([getTranslations("Footer"), getTranslations("Links")]);
  const groups = FOOTER_GROUPS.map((group) => ({
    key: group.key,
    links: builtOnly<FooterLinkItem>(group.links),
  })).filter((group) => group.links.length > 0);

  return (
    <footer className="w-full border-t border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {groups.map((group) => {
            const label = t(`groups.${group.key}`);
            return (
              <nav key={group.key} aria-label={label}>
                <h2 className="mb-3 font-mono text-xs font-bold tracking-[0.15em] text-amber uppercase">{label}</h2>
                <ul className="flex flex-col sm:gap-2">
                  {group.links.map((link) => (
                    <li key={link.key}>
                      <FooterLink href={link.href}>{links(link.key)}</FooterLink>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col gap-2 font-mono text-xs text-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("bottomLine")}</p>
          {/* Spec §8: the footer carries the one contact email. */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex min-h-11 items-center transition-colors hover:text-foreground sm:min-h-0"
          >
            {t("email", { email: CONTACT_EMAIL })}
          </a>
        </div>
      </div>
    </footer>
  );
}
