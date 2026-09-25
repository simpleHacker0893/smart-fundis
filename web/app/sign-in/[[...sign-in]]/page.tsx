import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth-layout";
import { SectionLabel } from "@/components/landing/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignIn");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * /sign-in (#28): the Stitch 07-sign-in-v3 chrome around Clerk's own
 * <SignIn /> (Google and email, as Clerk offers them). Styled through
 * lib/clerk-appearance.ts; the proxy and auth routes are unchanged (D-15).
 */
export default async function SignInPage() {
  const t = await getTranslations("SignIn");

  return (
    <AuthLayout
      label={t("label")}
      title={t("title")}
      body={t("body")}
      widget={<SignIn />}
      after={<p className="text-center text-xs text-foreground/75">{t("note")}</p>}
      aside={
        <div className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded border border-line p-6 sm:p-8 lg:min-h-[560px]">
          <Image
            src="/images/auth-bench-1280.webp"
            alt={t("imageAlt")}
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover opacity-40 contrast-125 grayscale"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-3">
            <span className="absolute top-0 left-0 size-3.5 border-t-2 border-l-2 border-foreground/70" />
            <span className="absolute top-0 right-0 size-3.5 border-t-2 border-r-2 border-foreground/70" />
            <span className="absolute bottom-0 left-0 size-3.5 border-b-2 border-l-2 border-foreground/70" />
            <span className="absolute right-0 bottom-0 size-3.5 border-r-2 border-b-2 border-foreground/70" />
          </div>
          <div className="relative">
            <SectionLabel>{t("label")}</SectionLabel>
          </div>
          <div className="relative mt-24">
            <p className="text-4xl leading-[1.05] font-black tracking-tight sm:text-5xl">
              <span className="block">{t("panelTitleLine1")}</span>
              <span className="block">{t("panelTitleLine2")}</span>
            </p>
            <p className="mt-3 max-w-md text-base text-foreground/80">{t("panelBody")}</p>
          </div>
        </div>
      }
    />
  );
}
