"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId } from "react";
import { cn } from "cn";
import type { NavGroup, NavItem, ShellAction } from "@/lib/app-nav";
import { NAV_ICONS } from "./icons";

export type NavMenuProps = {
  groups: readonly NavGroup[];
  site: NavGroup;
  footer: readonly NavItem[];
  pathname: string;
  /** The desktop 64 px rail: labels become accessible names plus a title tooltip. */
  collapsed?: boolean;
  onAction: (action: ShellAction) => void;
  /** Runs when a link is followed (the More sheet closes itself). */
  onNavigate?: () => void;
};

/**
 * The grouped menu (D2, D-65): the same in the desktop sidebar and the More
 * sheet. Role groups on top, the SMART FUNDIS group pushed down, then the
 * footer (Help, Sign out) above a hairline.
 */
export function NavMenu({ groups, site, footer, pathname, collapsed = false, onAction, onNavigate }: NavMenuProps) {
  const row = { pathname, collapsed, onAction, onNavigate };
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-col gap-6 pt-8">
        {groups.map((group) => (
          <Group key={group.key} group={group} {...row} />
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-6 pt-8 pb-4">
        <Group group={site} {...row} />
      </div>
      <ul className="border-t border-line py-2">
        {footer.map((item) => (
          <li key={item.key}>
            <Row item={item} {...row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

type RowContext = Omit<NavMenuProps, "groups" | "site" | "footer">;

function Group({ group, ...row }: { group: NavGroup } & RowContext) {
  const t = useTranslations("AppShell");
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <p
        id={id}
        data-category
        className={cn(
          "mb-2 px-4 font-mono text-xs tracking-[0.26em] text-dim uppercase",
          row.collapsed && "sr-only",
        )}
      >
        {t(`categories.${group.key}`)}
      </p>
      <ul>
        {group.items.map((item) => (
          <li key={item.key}>
            <Row item={item} {...row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const ROW =
  "relative flex min-h-12 w-full items-center gap-3 px-4 text-left text-base font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
const ACTIVE =
  "bg-foreground/[0.04] text-foreground before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary";
const INACTIVE = "text-dim hover:text-foreground";

function Row({ item, pathname, collapsed, onAction, onNavigate }: { item: NavItem } & RowContext) {
  const t = useTranslations("AppShell");
  const label = t(`items.${item.key}`);
  const Icon = NAV_ICONS[item.icon];
  const current = "href" in item && item.match?.(pathname) === true;
  const className = cn(ROW, current ? ACTIVE : INACTIVE, collapsed && "justify-center px-0");
  const body = (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
      <span className={collapsed ? "sr-only" : "min-w-0"}>{label}</span>
    </>
  );
  const title = collapsed ? label : undefined;

  if ("href" in item) {
    return (
      <Link
        href={item.href}
        data-nav-item={label}
        aria-current={current ? "page" : undefined}
        title={title}
        className={className}
        onClick={onNavigate}
      >
        {body}
      </Link>
    );
  }
  return (
    <button type="button" data-nav-item={label} title={title} className={className} onClick={() => onAction(item.action)}>
      {body}
    </button>
  );
}
