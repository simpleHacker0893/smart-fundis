import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { pillClass } from "@/components/ui/pill";
import { builtOnly, FOOTER_CTAS, FOOTER_GROUPS } from "@/lib/site-nav";

type FooterLink = (typeof FOOTER_GROUPS)[number]["links"][number];

/**
 * The static site footer from 00-shell-v2.md.
 * - Below 768 px it follows the REFERENCE: a centred "Show your work." with
 *   stacked full-width pills, the link groups, the faint mono wordmark and
 *   the legal lines.
 * - From 768 px it stops centring: headline left, pills in a row, 2 link
 *   columns and the legal lines in a row. From 1024 px it follows
 *   02-evidence-responsive: a CTA panel and 4 link columns.
 * Links to pages that don't exist yet are left out (HANDOFF §6, C-12), a
 * group link that repeats a CTA is dropped, and an empty group is hidden. In
 * V0 that leaves the "Join as a fundi" CTA and no groups.
 */
export async function SiteFooter() {
  const [t, shell, links] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Shell"),
    getTranslations("Links"),
  ]);
  const ctas = builtOnly(FOOTER_CTAS);
  const ctaHrefs = new Set<string>(ctas.map((cta) => cta.href));
  const groups = FOOTER_GROUPS.map((group) => ({
    key: group.key,
    links: builtOnly<FooterLink>(group.links).filter((link) => !ctaHrefs.has(link.href)),
  })).filter((group) => group.links.length > 0);

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-6 md:px-8 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left lg:rounded-sm lg:border lg:border-line lg:bg-panel lg:p-12">
          <h2 className="text-[2rem] leading-none font-black tracking-[-0.03em] uppercase lg:text-5xl">
            {t("headline")}
          </h2>
          <div className="flex w-full flex-col gap-2.5 md:w-auto md:flex-row md:gap-3">
            {ctas.map((cta) => (
              <Link
                key={cta.key}
                href={cta.href}
                className={pillClass({
                  variant: cta.primary ? "primary" : "secondary",
                  size: "full",
                  className: "md:w-auto",
                })}
              >
                {links(cta.key)}
              </Link>
            ))}
          </div>
        </div>

        {groups.length > 0 && (
          <nav
            aria-label={t("linksLabel")}
            className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-6 md:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-12 lg:border-t-0 lg:pt-0"
          >
            {groups.map((group) => (
              <div key={group.key}>
                {/* Dim, not amber (02 export): four amber labels would break 95 / 5. */}
                <h3 className="readout text-dim">{t(`groups.${group.key}`)}</h3>
                <ul className="mt-1">
                  {group.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-12 items-center text-sm text-dim hover:text-foreground"
                      >
                        {links(link.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}

        {/* Decorative repeat of the name, so --faint is allowed here (DESIGN.md L76). */}
        <div
          aria-hidden="true"
          className="my-8 overflow-hidden border-y border-line py-4 text-center select-none lg:my-12"
        >
          <span className="block font-mono text-2xl font-black tracking-[0.25em] whitespace-nowrap text-faint uppercase md:text-5xl lg:text-7xl xl:text-8xl">
            {shell("brand")}
          </span>
        </div>

        <div className="flex flex-col gap-1 font-mono text-xs text-dim md:flex-row md:justify-between">
          <p>{t("legal")}</p>
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
