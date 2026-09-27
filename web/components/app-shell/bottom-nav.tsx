"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "cn";
import type { BottomItem, ShellAction } from "@/lib/app-nav";
import { NAV_ICONS } from "./icons";

const SLOT =
  "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
const ACTIVE = "text-foreground before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-primary";
const INACTIVE = "text-dim hover:text-foreground";

/**
 * The mobile bottom nav (< 1024 px, D2): fixed, 64 px plus the safe area,
 * up to 3 of the role's items and then More, which opens the menu sheet.
 * No count badges or dots.
 */
export function BottomNav({
  items,
  pathname,
  onAction,
  onMore,
}: {
  items: readonly BottomItem[];
  pathname: string;
  onAction: (action: ShellAction) => void;
  onMore: () => void;
}) {
  const t = useTranslations("AppShell");
  return (
    <nav
      aria-label={t("bottomNavLabel")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const body = (
            <>
              <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
              <span>{t(`bottom.${item.key}`)}</span>
            </>
          );
          if ("href" in item) {
            const current = item.match(pathname);
            return (
              <li key={item.key} className="flex flex-1">
                <Link href={item.href} aria-current={current ? "page" : undefined} className={cn(SLOT, current ? ACTIVE : INACTIVE)}>
                  {body}
                </Link>
              </li>
            );
          }
          return (
            <li key={item.key} className="flex flex-1">
              <button type="button" className={cn(SLOT, INACTIVE)} onClick={() => onAction(item.action)}>
                {body}
              </button>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button type="button" aria-haspopup="dialog" className={cn(SLOT, INACTIVE)} onClick={onMore}>
            <Menu aria-hidden="true" className="size-6" strokeWidth={1.5} />
            <span>{t("bottom.more")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
