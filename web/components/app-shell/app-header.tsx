"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { AFTER_AUTH_PATH } from "@/lib/auth-routes";
import type { ShellRole } from "@/lib/app-nav";
import { Initials } from "./avatar";

const TARGET =
  "inline-flex size-12 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

/**
 * The app header (D2): sticky, graphite, a bottom hairline, no blur. 56 px
 * on mobile with the logo mark and the mono role label; 64 px from 1024 px
 * with the collapse toggle and the full lockup. The initials avatar opens
 * the avatar sheet. No bell in V7.
 */
export function AppHeader({
  role,
  initials,
  sidebarId,
  collapsed,
  onToggleSidebar,
  onAvatar,
}: {
  role: ShellRole | null;
  initials: string;
  sidebarId: string;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onAvatar: () => void;
}) {
  const t = useTranslations("AppShell");
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-line bg-background px-2 lg:h-16 lg:px-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-3 focus:text-base focus:font-semibold focus:text-background"
      >
        {t("skipToContent")}
      </a>
      <div className="flex min-w-0 items-center gap-1 lg:gap-2">
        <button
          type="button"
          aria-controls={sidebarId}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("expand") : t("collapse")}
          title={collapsed ? t("expand") : t("collapse")}
          onClick={onToggleSidebar}
          className={`${TARGET} hidden text-dim hover:text-foreground lg:inline-flex`}
        >
          <Toggle aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
        <Link href={AFTER_AUTH_PATH} aria-label={t("homeLabel")} className="flex h-12 min-w-0 items-center gap-3 rounded px-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
          <SiteLogo className="size-8 shrink-0" />
          <span className="hidden flex-col leading-none lg:flex">
            <span className="text-base font-semibold tracking-tight whitespace-nowrap">{t("brand")}</span>
            <span className="mt-1 font-mono text-xs tracking-[0.2em] whitespace-nowrap text-dim uppercase">{t("tagline")}</span>
          </span>
        </Link>
        {role ? (
          <span className="font-mono text-xs tracking-[0.26em] text-foreground uppercase lg:ml-4 lg:text-dim">{t(`roles.${role}`)}</span>
        ) : null}
      </div>
      <button type="button" aria-label={t("avatar.open")} aria-haspopup="dialog" onClick={onAvatar} className={TARGET}>
        <Initials initials={initials} />
      </button>
    </header>
  );
}
