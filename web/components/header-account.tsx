"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSignedIn } from "@/components/use-signed-in";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

// The pills stay visually compact (32 px mobile, 40 px desktop, as in the
// Stitch exports) while the link around them is a 48 px hit area (HANDOFF §6).
// The focus ring is drawn on the pill, not the invisible hit area.
const HIT = "group inline-flex h-12 items-center outline-none";
const PILL =
  "inline-flex items-center justify-center rounded-full font-bold uppercase group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring";

/** Header account actions: Sign in + Join when signed out, Dashboard when signed in. */
export function HeaderAccount() {
  const t = useTranslations("Shell");
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <Link href={AFTER_AUTH_PATH} className={HIT}>
        <span
          className={`${PILL} h-8 border border-line px-3 font-mono text-xs tracking-wider text-foreground hover:border-foreground/40 lg:h-10 lg:px-5 lg:tracking-widest`}
        >
          {t("dashboard")}
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
        {t("signIn")}
      </Link>
      {/* Mobile: the REFERENCE's compact "JOIN" pill. Its name includes the visible word. */}
      <Link href={SIGN_UP_PATH} aria-label={t("joinAsFundi")} className={`${HIT} lg:hidden`}>
        <span className={`${PILL} h-8 bg-primary px-3 text-xs tracking-wider text-primary-foreground`}>
          {t("join")}
        </span>
      </Link>
      {/* Desktop (02-evidence-responsive): "Join as a fundi". */}
      <Link href={SIGN_UP_PATH} className={`${HIT} hidden lg:inline-flex`}>
        <span
          className={`${PILL} h-10 bg-primary px-5 font-mono text-xs tracking-widest text-primary-foreground`}
        >
          {t("joinAsFundi")}
        </span>
      </Link>
    </>
  );
}
