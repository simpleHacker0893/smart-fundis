import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SectionLabel } from "@/components/landing/section";
import { pillClass } from "@/components/ui/pill";
import { SIGN_UP_PATH } from "@/lib/auth-routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Join");
  return { title: t("meta.title"), description: t("meta.description") };
}

/**
 * /join?role= (#27). Fundis (and any unknown or missing role) go to Clerk's
 * sign-up with the role kept for onboarding. Expert applications arrive in
 * V4, so role=expert shows a plain "Coming soon" readout, never a form.
 */
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const { role } = await searchParams;
  if (role !== "expert") {
    redirect(`${SIGN_UP_PATH}?role=fundi`);
  }

  const t = await getTranslations("Join");
  return (
    <main className="flex w-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <SectionLabel>{t("expert.label")}</SectionLabel>
        <span className="mb-4 self-start rounded border border-line px-2 py-0.5 font-mono text-xs tracking-widest text-foreground/60 uppercase">
          {t("comingSoon")}
        </span>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">{t("expert.title")}</h1>
        <p className="mb-8 max-w-xl text-base text-foreground/75">{t("expert.body")}</p>
        <div className="flex max-w-md flex-col gap-3 sm:flex-row">
          <Link href="/evidence" className={pillClass({ variant: "secondary", size: "full", className: "bg-panel sm:w-auto" })}>
            {t("expert.evidence")}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center text-sm text-foreground/75 underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("expert.home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
