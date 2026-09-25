"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PILL_HIT_AREA, pillClass } from "@/components/ui/pill";
import { useSignedIn } from "@/components/use-signed-in";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

/**
 * Header account actions: Sign in + Join when signed out, Dashboard when
 * signed in. The pills stay visually compact (32 px mobile, 40 px desktop,
 * as in the Stitch exports) inside a 48 px hit area (HANDOFF §6).
 */
export function HeaderAccount() {
  const t = useTranslations("Shell");
  const links = useTranslations("Links");
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <Link href={AFTER_AUTH_PATH} className={PILL_HIT_AREA}>
        <span
          className={pillClass({
            variant: "secondary",
            size: "compact",
            inHitArea: true,
            className: "font-mono lg:h-10 lg:px-5 lg:tracking-widest",
          })}
        >
          {links("dashboard")}
        </span>
      </Link>
    );
  }

  return (
    <>
      <Link
        href={SIGN_IN_PATH}
        className="hidden h-12 items-center font-mono text-xs uppercase tracking-wider text-foreground/70 hover:text-foreground lg:inline-flex"
      >
        {links("signIn")}
      </Link>
      {/* Mobile: the REFERENCE's compact "JOIN" pill. Its name includes the visible word. */}
      <Link href={SIGN_UP_PATH} aria-label={links("joinAsFundi")} className={`${PILL_HIT_AREA} lg:hidden`}>
        <span className={pillClass({ variant: "primary", size: "compact", inHitArea: true })}>
          {t("join")}
        </span>
      </Link>
      {/* Desktop (02-evidence-responsive): "Join as a fundi". */}
      <Link href={SIGN_UP_PATH} className={`${PILL_HIT_AREA} hidden lg:inline-flex`}>
        <span className={pillClass({ variant: "primary", size: "header", inHitArea: true })}>
          {links("joinAsFundi")}
        </span>
      </Link>
    </>
  );
}
