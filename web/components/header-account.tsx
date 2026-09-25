"use client";

import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PILL_HIT_AREA, pillClass } from "@/components/ui/pill";
import { useSignedIn } from "@/components/use-signed-in";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

/**
 * The header's account area, at every width.
 * - Signed out: "Sign in" and the Join pill ("Join" on mobile, "Join as a
 *   fundi" from 1024 px), each with a 48 px hit area.
 * - Signed in: a Dashboard link from 1024 px, and Clerk's account menu. Clerk
 *   gives it "Manage account" (profile, email, password, connected accounts,
 *   security) and "Sign out"; we add Dashboard to it.
 */
export function HeaderAccount() {
  const t = useTranslations("Shell");
  const links = useTranslations("Links");
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <>
        <Link
          href={AFTER_AUTH_PATH}
          className="hidden h-12 items-center rounded-full px-4 font-mono text-xs tracking-wider text-foreground/80 uppercase transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
        >
          {links("dashboard")}
        </Link>
        <span className="flex size-12 items-center justify-center">
          <UserButton
            appearance={{
              elements: {
                userButtonTrigger: "size-10 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2",
                avatarBox: "size-9",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label={links("dashboard")}
                labelIcon={<LayoutDashboard aria-hidden="true" className="size-4" strokeWidth={1.5} />}
                href={AFTER_AUTH_PATH}
              />
            </UserButton.MenuItems>
          </UserButton>
        </span>
      </>
    );
  }

  return (
    <>
      <Link
        href={SIGN_IN_PATH}
        className="inline-flex h-12 items-center rounded-full px-2 font-mono text-xs font-semibold tracking-wider text-foreground uppercase transition-colors hover:text-foreground/80 sm:px-4"
      >
        {links("signIn")}
      </Link>
      <Link href={SIGN_UP_PATH} aria-label={links("joinAsFundi")} className={`${PILL_HIT_AREA} lg:hidden`}>
        <span className={pillClass({ variant: "primary", size: "compact", inHitArea: true })}>{t("join")}</span>
      </Link>
      <Link href={SIGN_UP_PATH} className={pillClass({ variant: "primary", size: "header", className: "max-lg:hidden" })}>
        {links("joinAsFundi")}
      </Link>
    </>
  );
}
