import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OnboardingForm } from "./onboarding-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Onboarding");
  return { title: t("meta.title") };
}

/**
 * /onboarding (#37): the minimal Fundi profile form. Guarded here as well as
 * in the proxy (D-15). Unstyled for V1; Stitch styling comes in V3.
 */
export default async function OnboardingPage() {
  await auth.protect();
  const t = await getTranslations("Onboarding");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-base text-foreground/75">{t("body")}</p>
      </div>
      <OnboardingForm />
    </main>
  );
}
