import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FundiHome } from "./fundi-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FundiPage");
  return { title: t("meta.title") };
}

/**
 * /fundi (#37): the Fundi's page. Guarded here as well as in the proxy
 * (D-15); FundiHome checks the Fundi role once `users.me` loads (spec §4).
 * Unstyled for V1; #38 adds the Assessment list, Stitch styling comes in V3.
 */
export default async function FundiPage() {
  await auth.protect();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <FundiHome />
    </main>
  );
}
