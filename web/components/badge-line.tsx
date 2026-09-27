"use client";

import { useFormatter, useTranslations } from "next-intl";
import { cn } from "cn";
import { useCatalogueNames } from "@/components/use-catalogue-names";

/** What a Badge line needs: the Trade, the Task and the Expert's approval date. */
export type BadgeFields = {
  tradeSlug: string;
  tradeName: string;
  taskSlug: string;
  taskName: string;
  decidedAt: number;
};

/**
 * "Verified by Smart Fundis — <Trade>: <Task> · <date>" (US-5.4): the one
 * Badge wording, shared by the public profile and the Fundi's own pages.
 * Dated in the provider's time zone (Africa/Nairobi).
 */
export function useBadgeLine(): (badge: BadgeFields) => string {
  const t = useTranslations("PublicProfile");
  const format = useFormatter();
  const names = useCatalogueNames();
  return (badge) =>
    t("badgeLine", {
      trade: names.trade(badge.tradeSlug, badge.tradeName),
      task: names.task(badge.taskSlug, badge.taskName),
      date: format.dateTime(badge.decidedAt, { dateStyle: "medium" }),
    });
}

/**
 * The Badge line in app mode: a white ✓ with the amber tick (the only amber
 * outside the primary pill, D10), then the words. The tick is decorative.
 */
export function BadgeLine({ badge, className }: { badge: BadgeFields; className?: string }) {
  const line = useBadgeLine();
  return (
    <p className={cn("flex items-start gap-3 text-base font-medium break-words", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="mt-0.5 size-5 shrink-0 rounded border border-foreground/70"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.5 10.5l3 3 6-7" className="stroke-primary" />
      </svg>
      <span data-testid="badge-line">{line(badge)}</span>
    </p>
  );
}
