import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { pillClass } from "@/components/ui/pill";
import { builtOnly, COMPANY_ANCHOR, FOOTER_GROUPS, PRIMARY_CTAS } from "@/lib/site-nav";

type FooterLink = (typeof FOOTER_GROUPS)[number]["links"][number];

/**
 * The footer from the Stitch landing screen (01-landing-v3-responsive.html):
 * a centred "Show your work." band with the two pills, a 2-column (4 from
 * 768 px) directory, the giant mono wordmark and the legal row.
 * - The directory is the COMPANY target (#company) for the header and tabs.
 * - Links to pages that don't exist yet are left out; a directory link that
 *   repeats a CTA is dropped; a group left empty is hidden (For Experts, until
 *   /experts exists).
 * - Group labels are dim, not the export's amber (95 / 5, D-9).
 */
export async function SiteFooter() {
  const [t, shell, links] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Shell"),
    getTranslations("Links"),
  ]);
  const ctas = builtOnly(PRIMARY_CTAS);
  const ctaHrefs = new Set<string>(ctas.map((cta) => cta.href));
  const groups = FOOTER_GROUPS.map((group) => ({
    key: group.key,
    links: builtOnly<FooterLink>(group.links).filter((link) => !ctaHrefs.has(link.href)),
  })).filter((group) => group.links.length > 0);

  return (
    <footer className="w-full border-t border-line pt-16 pb-12 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center border-b border-line pb-16 text-center">
          <h2 className="mb-8 text-4xl font-black tracking-tight uppercase sm:text-6xl lg:text-7xl">
            {t("headline")}
          </h2>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            {ctas.map((cta) => (
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

        <nav
          id={COMPANY_ANCHOR.slice(1)}
          aria-label={t("linksLabel")}
          className="grid scroll-mt-20 grid-cols-2 gap-8 border-b border-line py-12 md:grid-cols-4 lg:scroll-mt-24"
        >
          {groups.map((group) => (
            <div key={group.key}>
              <h3 className="readout mb-2 font-semibold text-dim">{t(`groups.${group.key}`)}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-12 items-center text-sm text-foreground/75 transition-colors hover:text-foreground"
                    >
                      {links(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Decorative repeat of the name at 20% white, as drawn in Stitch. */}
        <div
          aria-hidden="true"
          className="my-12 flex items-center justify-center overflow-hidden border-y border-line py-6 select-none"
        >
          <span className="font-mono text-3xl font-black tracking-[0.25em] whitespace-nowrap text-foreground/20 uppercase sm:text-5xl lg:text-7xl">
            {shell("brand")}
          </span>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 font-mono text-xs text-foreground/75 sm:flex-row sm:items-center">
          <p>{t("legal")}</p>
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
