"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { STATUS_GLYPHS } from "@/components/ui/status-chip";
import { waitingAge } from "@/lib/waiting-age";
import { SECTION_LABEL } from "./expert-styles";

const ERROR_GLYPH = STATUS_GLYPHS.failed;

/**
 * The waiting age as words ("3 h"), from a stored time. `now` is read once
 * when the view mounts, so the age is a snapshot and never ticks like a live
 * counter (D9: nothing looks live that isn't).
 */
export function useWaitingAge(): (since: number) => string {
  const t = useTranslations("ReviewQueue");
  const [now] = useState(() => Date.now());
  return (since) => {
    const age = waitingAge(since, now);
    return age.unit === "now" ? t("age.now") : t(`age.${age.unit}`, { n: age.n });
  };
}

/** A field or form error: a neutral ✕ and the message, announced as an alert (D9). */
export function ErrorLine({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="flex gap-2 text-sm text-foreground">
      <span aria-hidden="true">{ERROR_GLYPH}</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * A bordered readout panel for the empty, error and not-available states
 * (D9): an optional mono tag (with ✕ for errors), one plain sentence and at
 * most one action. No image.
 */
export function ReadoutPanel({
  tag,
  error = false,
  children,
  action,
}: {
  tag?: string;
  error?: boolean;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded border border-line p-4 lg:p-6">
      {tag ? (
        <p className={`${SECTION_LABEL} flex gap-2`}>
          {error ? (
            <span aria-hidden="true" className="text-foreground">
              {ERROR_GLYPH}
            </span>
          ) : null}
          <span>{tag}</span>
        </p>
      ) : null}
      <p className="text-base">{children}</p>
      {action}
    </div>
  );
}
