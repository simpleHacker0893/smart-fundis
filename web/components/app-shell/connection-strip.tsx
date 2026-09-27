"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useConnection } from "./use-connection";

// Decorative glyphs (D4); the words carry the meaning.
const OFFLINE_GLYPH = "✕";
const ONLINE_GLYPH = "●";

/**
 * The offline and back-online strip under the header (D9). It sits in a
 * polite live region, so the change is announced without taking focus. The
 * ✕ is neutral white, never amber.
 */
export function ConnectionStrip() {
  const t = useTranslations("AppShell");
  const format = useFormatter();
  const connection = useConnection();

  return (
    <div aria-live="polite" role="status">
      {connection.kind === "offline" ? (
        <p className="flex min-h-10 items-center gap-2 border-b border-line bg-panel px-4 font-mono text-xs text-foreground lg:px-8">
          <span aria-hidden="true">{OFFLINE_GLYPH}</span>
          {t("connection.offline", {
            time: format.dateTime(new Date(connection.since), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
          })}
        </p>
      ) : null}
      {connection.kind === "back" ? (
        <p className="flex min-h-10 items-center gap-2 border-b border-line bg-panel px-4 font-mono text-xs text-foreground lg:px-8">
          <span aria-hidden="true">{ONLINE_GLYPH}</span>
          {t("connection.back")}
        </p>
      ) : null}
    </div>
  );
}
