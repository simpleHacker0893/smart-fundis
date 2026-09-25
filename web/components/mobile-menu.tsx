"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSignedIn } from "@/components/use-signed-in";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";
import { builtOnly, COMPANY_NAV, HEADER_NAV } from "@/lib/site-nav";

const ROW =
  "flex min-h-12 items-center border-b border-line font-mono text-xs uppercase tracking-[0.26em] text-foreground hover:text-amber";

/**
 * The menu sheet from 00-shell-v2.md, below 1024 px. It opens from the right
 * with 48 px rows: the nav items whose pages exist, a hairline, then Sign in
 * and a full-width "Join as a fundi" pill (or Dashboard when signed in).
 * Base UI's Dialog gives it aria-expanded, a focus trap, Escape to close and
 * focus returning to the button. No motion in V0.
 */
export function MobileMenu() {
  const t = useTranslations("Shell");
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Only pages that exist (lib/site-nav.ts). In V0 none of these are built yet.
  const nav = [...builtOnly(HEADER_NAV), ...builtOnly(COMPANY_NAV)];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("openMenu")}
        className="-mr-3 inline-flex size-12 items-center justify-center text-foreground hover:text-amber lg:hidden"
      >
        <MenuIcon aria-hidden="true" className="size-6" strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent side="right" closeLabel={t("closeMenu")} className="gap-0 px-4 pt-0">
        <SheetTitle className="flex h-12 items-center font-mono text-xs uppercase tracking-[0.26em] text-dim">
          {t("menuTitle")}
        </SheetTitle>
        {nav.length > 0 && (
          <nav aria-label={t("primaryNav")} className="border-t border-line">
            {nav.map((item) => (
              <Link key={item.key} href={item.href} onClick={close} className={ROW}>
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex flex-col gap-4 border-t border-line">
          {signedIn ? (
            <Link href={AFTER_AUTH_PATH} onClick={close} className={ROW}>
              {t("dashboard")}
            </Link>
          ) : (
            <>
              <Link href={SIGN_IN_PATH} onClick={close} className={ROW}>
                {t("signIn")}
              </Link>
              <Link
                href={SIGN_UP_PATH}
                onClick={close}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground"
              >
                {t("joinAsFundi")}
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
