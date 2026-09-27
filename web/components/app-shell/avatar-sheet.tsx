"use client";

import { useTranslations } from "next-intl";
import type { Ref } from "react";
import type { ShellRole } from "@/lib/app-nav";
import { Initials } from "./avatar";
import { RoleSwitch } from "./role-switch";
import { Sheet } from "./sheet";

export type ShellUser = { initials: string; name: string | null; email: string | null };

const ACTION =
  "flex min-h-12 w-full items-center px-4 text-left text-base text-foreground hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

/**
 * The avatar sheet (D2): initials, name and email, the DASHBOARD switch for
 * a User with two or more roles (none at all otherwise), then Manage account
 * (Clerk's account page) and Sign out.
 */
export function AvatarSheet({
  ref,
  user,
  role,
  dualRole,
  onManage,
  onSignOut,
}: {
  ref: Ref<HTMLDialogElement>;
  user: ShellUser;
  role: ShellRole | null;
  dualRole: boolean;
  onManage: () => void;
  onSignOut: () => void;
}) {
  const t = useTranslations("AppShell");
  return (
    <Sheet ref={ref} title={t("sheet.accountTitle")} anchored>
      <div className="flex items-center gap-3 px-4 py-4">
        <Initials initials={user.initials} className="size-12 text-sm" />
        <div className="flex min-w-0 flex-col gap-1">
          {user.name ? <p className="text-base font-semibold [overflow-wrap:anywhere]">{user.name}</p> : null}
          {user.email ? <p className="font-mono text-xs text-dim [overflow-wrap:anywhere]">{user.email}</p> : null}
        </div>
      </div>
      {dualRole ? <RoleSwitch current={role} className="border-t border-line" /> : null}
      <div className="flex flex-col border-t border-line py-2">
        <button type="button" className={ACTION} onClick={onManage}>
          {t("avatar.manage")}
        </button>
        <button type="button" className={ACTION} onClick={onSignOut}>
          {t("avatar.signOut")}
        </button>
      </div>
    </Sheet>
  );
}
