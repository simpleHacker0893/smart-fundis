import { getTranslations } from "next-intl/server";

/** The auth pages' footer (Stitch 07-09): one centred legal line. */
export async function SlimFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="w-full border-t border-line">
      <p className="mx-auto max-w-7xl px-4 py-6 text-center font-mono text-xs tracking-wider text-foreground/75 uppercase">
        {t("bottomLine")}
      </p>
    </footer>
  );
}
