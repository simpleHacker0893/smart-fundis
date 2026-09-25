import { ArrowRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { SectionLabel } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { SIGN_IN_PATH } from "@/lib/auth-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignedOut");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * /signed-out (#28): where Clerk sends visitors after sign-out
 * (afterSignOutUrl in app/layout.tsx). From 09-signed-out-v3-responsive.
 */
export default async function SignedOutPage() {
  const t = await getTranslations("SignedOut");

  return (
    <main className="flex w-full flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <div className="lg:order-2">
          <SectionLabel>{t("label")}</SectionLabel>
          <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl">{t("title")}</h1>
          <p className="mb-8 text-base text-foreground/75">{t("body")}</p>
          <div className="flex max-w-md flex-col gap-3 sm:flex-row">
            <Link href={SIGN_IN_PATH} className={pillClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
              {t("signIn")}
              <ArrowRight aria-hidden="true" className="ml-2 size-4" strokeWidth={2} />
            </Link>
            <Link href="/" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
              <Home aria-hidden="true" className="mr-2 size-4" strokeWidth={1.5} />
              {t("home")}
            </Link>
          </div>
        </div>
        <div className="lg:order-1">
          <EvidenceFrame
            label={t("frame")}
            tag={t("frameTag")}
            src="/images/auth-bench-1280.webp"
            alt={t("imageAlt")}
            aspect="aspect-video"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
      </div>
    </main>
  );
}
