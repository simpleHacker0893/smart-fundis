import { useTranslations } from "next-intl";
import { SCOPE_CHECKS, SCOPE_NOT_CHECKED } from "@/lib/landing";

/**
 * "One word, exactly defined": what "Verified by Smart Fundis" covers and
 * what it doesn't. Shared by the landing page (07 — Scope) and /evidence
 * (04 — Scope), so the claim is worded once.
 */
export function ScopeLedgers() {
  const t = useTranslations("Landing");
  const glyphs = useTranslations("Glyphs");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded border border-line bg-panel p-5 sm:p-6">
        <h3 className="mb-4 font-mono text-xs font-bold tracking-widest uppercase">{t("scope.check")}</h3>
        <ul className="flex flex-col gap-3 text-sm">
          {SCOPE_CHECKS.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span aria-hidden="true">{glyphs("pass")}</span>
              {t(`scope.checks.${item}`)}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded border border-line bg-panel p-5 sm:p-6">
        <h3 className="mb-4 font-mono text-xs font-bold tracking-widest text-foreground/75 uppercase">
          {t("scope.dontCheck")}
        </h3>
        <ul className="flex flex-col gap-3 text-sm text-foreground/75">
          {SCOPE_NOT_CHECKED.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span aria-hidden="true">{glyphs("no")}</span>
              <span className="line-through decoration-foreground/40">{t(`scope.notChecked.${item}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-line pt-4 font-mono text-xs leading-relaxed text-foreground/75">
          {t("scope.certify")}
        </p>
      </div>
    </div>
  );
}
