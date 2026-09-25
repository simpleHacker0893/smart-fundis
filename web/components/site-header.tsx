import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAccount } from "@/components/header-account";
import { SiteLogo } from "@/components/site-logo";
import { builtOnly, SECTION_NAV } from "@/lib/site-nav";

/**
 * The sticky site header (operator redesign, 2026-09-25, on the Stitch
 * landing v3 look).
 * - Mobile: row 1 (48 px) holds the lockup, Sign in and Join (or the Clerk
 *   account menu); row 2 (44 px) is the always-visible section nav. The
 *   VERIFIED SKILLS tag joins the name from 640 px, where it has room.
 * - 1024 px and up: one 72 px row with the lockup, the nav in the middle and
 *   the account actions on the right.
 * The lockup follows DESIGN.md L92-99: the mark, "Smart Fundis" at weight 600
 * and the mono tag "VERIFIED SKILLS" in dim. The nav points at landing
 * sections and the footer directory, never at pages that don't exist.
 */
export async function SiteHeader() {
  const [t, links] = await Promise.all([getTranslations("Shell"), getTranslations("Links")]);
  const nav = builtOnly(SECTION_NAV);

  const navLink =
    "inline-flex items-center justify-center font-mono text-xs uppercase text-foreground/80 transition-colors hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-background/90 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Link
          href="/"
          aria-label={t("homeLabel")}
          className="-ml-1 flex h-12 min-w-0 shrink-0 items-center gap-3 rounded-lg px-1 lg:gap-3.5"
        >
          <SiteLogo className="size-8 shrink-0 lg:size-10" />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap lg:text-lg">{t("brand")}</span>
            <span className="mt-1 hidden font-mono text-[11px] tracking-[0.2em] whitespace-nowrap text-dim uppercase sm:block">
              {t("tagline")}
            </span>
          </span>
        </Link>

        <nav aria-label={t("primaryNav")} className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link key={item.key} href={item.href} className={`${navLink} h-12 rounded-full px-4 tracking-wider hover:bg-accent`}>
              {links(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <HeaderAccount />
        </div>
      </div>

      {/* Mobile and tablet: the section nav as a second, always-visible row. */}
      <nav aria-label={t("sectionsNav")} className="border-t border-line lg:hidden">
        <div className="mx-auto grid h-11 max-w-7xl grid-cols-4 px-2 sm:px-4">
          {nav.map((item) => (
            <Link key={item.key} href={item.href} className={`${navLink} h-11 tracking-[0.12em] sm:tracking-widest`}>
              {links(item.key)}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
