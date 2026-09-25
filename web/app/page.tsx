import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-base text-muted-foreground">{t("tagline")}</p>
    </main>
  );
}
