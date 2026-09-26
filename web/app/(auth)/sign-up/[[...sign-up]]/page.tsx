import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth-layout";
import { EvidenceFrame } from "@/components/landing/evidence-frame";
import { Tag } from "@/components/landing/section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignUp");
  return { title: t("meta.title"), description: t("meta.description") };
}

/** Step 01 exists today; profile, consent and recording arrive with V1. */
const STEPS = [
  { n: "1", soon: false },
  { n: "2", soon: true },
  { n: "3", soon: true },
  { n: "4", soon: true },
] as const;

/**
 * /sign-up, "Join as a fundi" (#28): the Stitch 08-join-v3 chrome around
 * Clerk's own <SignUp />. Clerk's real fields (Google, email) win over the
 * mockup's. The onboarding steps after the account aren't built yet, so
 * they carry "Coming soon"; the mockup's "Become a verifier" link is left
 * out until /experts exists.
 */
export default async function SignUpPage() {
  const [t, common] = await Promise.all([getTranslations("SignUp"), getTranslations("Common")]);

  return (
    <AuthLayout
      label={t("label")}
      title={t("title")}
      body={t("body")}
      widget={<SignUp />}
      aside={
        <div className="flex flex-col gap-4">
          <EvidenceFrame
            label={t("frame")}
            tag={t("frameTag")}
            src="/images/sf-braiding-hands-1280.webp"
            alt={t("imageAlt")}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
          <div className="rounded border border-line bg-panel p-5">
            <h2 className="mb-3 font-mono text-xs tracking-widest text-foreground/75 uppercase">{t("stepsTitle")}</h2>
            <ol className="flex flex-col gap-3">
              {STEPS.map((step) => (
                <li key={step.n} className="flex items-start justify-between gap-3">
                  <span className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${step.soon ? "bg-foreground/30" : "bg-foreground"}`}
                    />
                    <span className="flex flex-col">
                      <span className={`font-mono text-xs tracking-widest uppercase ${step.soon ? "text-foreground/75" : "text-foreground"}`}>
                        {t(`steps.${step.n}.tag`)}
                      </span>
                      <span className="text-sm">{t(`steps.${step.n}.body`)}</span>
                    </span>
                  </span>
                  {step.soon && <Tag>{common("comingSoon")}</Tag>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      }
    />
  );
}
