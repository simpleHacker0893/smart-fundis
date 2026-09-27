import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PAGE_MAIN } from "@/components/ui/app-type";
import { FundiGuard } from "./fundi-guard";
import { FundiHome } from "./fundi-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("FundiPage");
  return { title: t("meta.title") };
}

/**
 * /fundi, the Fundi home (prompt 25, #67). Guarded here as well as in the
 * proxy (D-15); FundiGuard checks the Fundi role once `users.me` loads
 * (spec §4). The upload flow lives at /fundi/record.
 */
export default async function FundiPage() {
  await auth.protect();

  return (
    <main className={PAGE_MAIN}>
      <FundiGuard>
        <FundiHome />
      </FundiGuard>
    </main>
  );
}
