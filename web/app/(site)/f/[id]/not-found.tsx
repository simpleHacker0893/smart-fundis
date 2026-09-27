import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * The 404 for /f/<id> (#42): a missing, hidden or malformed profile id. It
 * never says which, so a hidden profile can't be told from a mistyped link.
 */
export default async function PublicProfileNotFound() {
  const t = await getTranslations("PublicProfile.notFound");
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-base text-foreground/75">{t("body")}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center self-start underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {t("home")}
      </Link>
    </main>
  );
}
