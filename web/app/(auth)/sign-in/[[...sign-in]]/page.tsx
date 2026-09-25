import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth-layout";
import { Reticles } from "@/components/landing/reticles";

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
          <Reticles />
          {/* The session label sits once, above the page heading (#18 review). */}
          <div className="relative mt-auto pt-24">
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
