"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { ROLE_HOME, type ShellRole } from "@/lib/app-nav";

const ROLES: readonly ShellRole[] = ["fundi", "expert"];

/**
 * The DASHBOARD radio group (D2, US-8.18), shown only to a User who holds
 * two or more roles. Choosing a role opens its home. Roles are derived
 * (ADR-18): this never offers a role the User doesn't hold.
 * Not yet saved on the server: users.setDashboardPref arrives with V7-1 (#46).
 */
export function RoleSwitch({ current }: { current: ShellRole | null }) {
  const t = useTranslations("AppShell");
  const router = useRouter();
  const name = useId();
  const [pending, startTransition] = useTransition();

  return (
    <fieldset className="border-t border-line px-4 py-4">
      <legend className="float-left mb-2 w-full font-mono text-xs tracking-[0.26em] text-dim uppercase">{t("switcher.legend")}</legend>
      <div className="clear-left flex flex-col">
        {ROLES.map((role) => {
          const selected = role === current;
          return (
            <label
              key={role}
              className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-line text-base last:border-b-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                name={name}
                value={role}
                checked={selected}
                className="sr-only"
                onChange={() => startTransition(() => router.push(ROLE_HOME[role]))}
              />
              <span aria-hidden="true" className="w-4 text-center">
                {selected ? "●" : "○"}
              </span>
              <span className="flex-1">{t(`switcher.${role}`)}</span>
              {selected ? <span className="font-mono text-xs tracking-[0.08em] text-dim uppercase">{t("switcher.current")}</span> : null}
            </label>
          );
        })}
      </div>
      <p role="status" className="min-h-6 pt-2 font-mono text-xs text-dim">
        {pending ? t("switcher.switching") : null}
      </p>
    </fieldset>
  );
}
