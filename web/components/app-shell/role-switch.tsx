"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { cn } from "cn";
import { ROLE_HOME, type ShellRole } from "@/lib/app-nav";

const ROLES: readonly ShellRole[] = ["fundi", "expert"];

/**
 * The DASHBOARD switch (D2, US-8.18), shown only to a User who holds two or
 * more roles: in the avatar sheet, and in the desktop sidebar's footer. Each
 * role is a 56 px button with aria-pressed, the current one marked ● and
 * "Current". A switch happens only on an explicit click, Enter or Space,
 * never on arrow keys as a radio group would (WCAG 3.2.2). Roles are derived
 * (ADR-18): this never offers a role the User doesn't hold.
 * Not yet saved on the server: users.setDashboardPref arrives with V7-1 (#46).
 */
export function RoleSwitch({ current, className }: { current: ShellRole | null; className?: string }) {
  const t = useTranslations("AppShell");
  const router = useRouter();
  const legend = useId();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-labelledby={legend} className={cn("px-4 py-4", className)}>
      <p id={legend} className="mb-2 font-mono text-xs tracking-[0.26em] text-dim uppercase">
        {t("switcher.legend")}
      </p>
      <div className="flex flex-col">
        {ROLES.map((role) => {
          const selected = role === current;
          return (
            <button
              key={role}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (!selected) startTransition(() => router.push(ROLE_HOME[role]));
              }}
              className="flex min-h-14 w-full items-center gap-3 border-b border-line text-left text-base text-foreground last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span aria-hidden="true" className="w-4 text-center">
                {selected ? "●" : "○"}
              </span>
              <span className="flex-1">{t(`switcher.${role}`)}</span>
              {selected ? <span className="font-mono text-xs tracking-[0.08em] text-dim uppercase">{t("switcher.current")}</span> : null}
            </button>
          );
        })}
      </div>
      <p role="status" className="min-h-6 pt-2 font-mono text-xs text-dim">
        {pending ? t("switcher.switching") : null}
      </p>
    </div>
  );
}
