import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { builtOnly, FOOTER_CTAS, FOOTER_GROUPS } from "@/lib/site-nav";

type FooterLink = (typeof FOOTER_GROUPS)[number]["links"][number];

const PILL =
  "inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-xs font-bold uppercase tracking-wider whitespace-nowrap lg:w-auto";

/**
 * The static site footer from 00-shell-v2.md.
 * - Mobile follows the REFERENCE: a centred "Show your work." with stacked
 *   pills, then the link groups, the faint mono wordmark and the legal lines.
 * - 1024 px and up follows 02-evidence-responsive: a CTA band, 4 link
 *   columns, the full-width wordmark, then the legal row.
 * Links (and whole groups) to pages that don't exist yet are left out
 * (HANDOFF §6, C-12), so V0 shows only "Join as a fundi".
 */
export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const ctas = builtOnly(FOOTER_CTAS);
  const groups = FOOTER_GROUPS.map((group) => ({
    key: group.key,
    links: builtOnly<FooterLink>(group.links),
  })).filter((group) => group.links.length > 0);

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-6 lg:px-12 lg:pt-16">
        <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:rounded-sm lg:border lg:border-line lg:bg-panel lg:p-12 lg:text-left">
          <h2 className="text-[2rem] leading-none font-black tracking-[-0.03em] uppercase lg:text-5xl">
            {t("headline")}
          </h2>
          <div className="flex w-full flex-col gap-2.5 lg:w-auto lg:flex-row lg:gap-3">
            {ctas.map((cta) => (
              <Link
                key={cta.key}
                href={cta.href}
                className={
                  cta.primary
                    ? `${PILL} bg-primary text-primary-foreground`
                    : `${PILL} border border-line text-foreground hover:border-foreground/40`
                }
              >
                {t(`cta.${cta.key}`)}
              </Link>
            ))}
          </div>
        </div>

        {groups.length > 0 && (
          <nav
            aria-label={t("linksLabel")}
            className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-6 lg:mt-16 lg:grid-cols-4 lg:gap-12 lg:border-t-0 lg:pt-0"
          >
            {groups.map((group) => (
              <div key={group.key}>
                <h3 className="readout text-amber">{t(`groups.${group.key}`)}</h3>
                <ul className="mt-1">
                  {group.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-12 items-center text-sm text-dim hover:text-foreground"
                      >
                        {t(`links.${link.key}`)}
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
          <span className="block font-mono text-2xl font-black tracking-[0.25em] whitespace-nowrap text-faint uppercase lg:text-7xl xl:text-8xl">
            {t("wordmark")}
          </span>
        </div>

        <div className="flex flex-col gap-1 font-mono text-xs text-dim lg:flex-row lg:justify-between">
          <p>{t("legal")}</p>
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
