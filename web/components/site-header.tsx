import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAccount } from "@/components/header-account";
import { MobileMenu } from "@/components/mobile-menu";
import { SiteLogo } from "@/components/site-logo";
import { builtOnly, HEADER_NAV } from "@/lib/site-nav";

/**
 * The static site header (design/HANDOFF.md §0, §6).
 * - Below 1024 px: the REFERENCE's 48 px sticky header: logo tile, wordmark,
 *   "JOIN" pill and menu button.
 * - 1024 px and up: the 02-evidence-responsive 72 px header: the mono nav,
 *   then Sign in and "Join as a fundi".
 * Nav items appear only once their pages exist (lib/site-nav.ts); in V0 none
 * do, so the desktop nav is empty. COMPANY ▾ (About, Contact us) arrives with
 * those pages. The bottom line is --line, not the export's amber hairline.
 */
export async function SiteHeader() {
  const t = await getTranslations("Shell");
  const nav = builtOnly(HEADER_NAV);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-between gap-2 px-4 lg:h-[72px] lg:px-12">
        <Link href="/" className="flex h-12 min-w-0 items-center gap-2 lg:gap-2.5">
          <SiteLogo className="size-6 shrink-0 lg:size-8" />
          <span className="truncate text-sm font-bold uppercase tracking-[0.26em] lg:font-mono lg:tracking-[0.24em]">
            {t("brand")}
          </span>
        </Link>
        {nav.length > 0 && (
          <nav aria-label={t("primaryNav")} className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="inline-flex h-12 items-center font-mono text-xs uppercase tracking-wider text-foreground/60 hover:text-foreground"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex shrink-0 items-center gap-2 lg:gap-5">
          <HeaderAccount />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
