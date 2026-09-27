"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { waitingAge } from "@/lib/waiting-age";

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
