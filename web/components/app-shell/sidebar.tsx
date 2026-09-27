"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "cn";
import { NavMenu, type NavMenuProps } from "./nav-menu";

/**
 * The desktop sidebar (≥ 1024 px, D2): 248 px on the panel colour with a
 * right hairline, or the 64 px icon rail. The primary action sits on top,
 * then the grouped menu, the SMART FUNDIS group and the footer: the
 * DASHBOARD switch for a dual-role User (D2; the rail leaves it to the
 * avatar sheet, as its labels need the width), then ACCOUNT.
 */
export function Sidebar({
  id,
  collapsed,
  primaryAction,
  roleSwitch,
  menu,
}: {
  id: string;
  collapsed: boolean;
  primaryAction: ReactNode;
  roleSwitch: ReactNode;
  menu: Omit<NavMenuProps, "collapsed" | "footerStart">;
}) {
  const t = useTranslations("AppShell");
  return (
    <aside
      id={id}
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel lg:flex",
        "motion-safe:transition-[width] motion-safe:duration-200",
        collapsed ? "lg:w-16" : "lg:w-[248px]",
      )}
    >
      {primaryAction ? <div className={cn("pt-6", collapsed ? "flex justify-center" : "px-4")}>{primaryAction}</div> : null}
      <nav aria-label={t("menuLabel")} className="flex flex-1 flex-col">
        <NavMenu {...menu} collapsed={collapsed} footerStart={collapsed ? null : roleSwitch} />
      </nav>
    </aside>
  );
}
