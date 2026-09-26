"use client";

import { useTranslations } from "next-intl";
import type messages from "@/messages/en.json";

type CatalogueSlug = keyof (typeof messages)["TradeCatalogue"];
type RubricTaskSlug = keyof (typeof messages)["Rubrics"];

/**
 * Names the user sees for Trades, Tasks and Rubric items. Convex stores
 * English names; the copy lives in next-intl keyed by slug (so Kiswahili can
 * be added later, D-64). A slug with no message falls back to the server's
 * English text, so a Trade or Task added in Convex still shows a name.
 */
export function useCatalogueNames() {
  const tc = useTranslations("TradeCatalogue");
  const tr = useTranslations("Rubrics");
  return {
    trade: (slug: string, fallback: string): string => {
      const key = `${slug as CatalogueSlug}.name` as const;
      return tc.has(key) ? tc(key) : fallback;
    },
    task: (taskSlug: string, fallback: string): string => {
      const key = `${taskSlug as RubricTaskSlug}.name` as const;
      return tr.has(key) ? tr(key) : fallback;
    },
    rubricItem: (taskSlug: string, itemId: string, fallback: string): string => {
      const key = `${taskSlug}.items.${itemId}` as `${RubricTaskSlug}.name`;
      return tr.has(key) ? tr(key) : fallback;
    },
  };
}
