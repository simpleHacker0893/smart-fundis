"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { TRADE_LICENCE } from "@convex/lib/trades";
import { FIELD, LABEL } from "@/components/ui/field-label";
import {
  selectedTrades,
  toggleSlug,
  TRADE_TYPES,
  visibleTrades,
  type PickerTrade,
  type TradeType,
} from "@/lib/trade-picker";
import type messages from "@/messages/en.json";

type CatalogueSlug = keyof (typeof messages)["TradeCatalogue"];

type Props = {
  trades: readonly PickerTrade[];
  /** The fieldset's legend. */
  legend: string;
  invalid?: true;
  /** The inline error's id, when there is one. */
  errorId?: string;
  /** The inline error, shown under the list. */
  error?: ReactNode;
};

/**
 * The onboarding Trade picker (#37, operator change 2): "don't use rows, use
 * a dropdown list for the categories". A native type-of-work select (light on
 * low-end Android), a search across every Trade, and only the chosen type's
 * Trades as a checkbox list. Selections persist across types and show as
 * removable chips. Each selected slug is a hidden `tradeSlugs` input, so the
 * form reads them with FormData whatever type is showing.
 */
export function TradePicker({ trades, legend, invalid, errorId, error }: Props) {
  const t = useTranslations("TradePicker");
  const tc = useTranslations("TradeCatalogue");
  const id = useId();
  const [type, setType] = useState<TradeType>(TRADE_TYPES[0]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const catalogueKey = (trade: PickerTrade) => trade.slug as CatalogueSlug;
  const nameOf = (trade: PickerTrade) =>
    tc.has(`${catalogueKey(trade)}.name`) ? tc(`${catalogueKey(trade)}.name`) : trade.name;
  const descriptionOf = (trade: PickerTrade) =>
    tc.has(`${catalogueKey(trade)}.description`) ? tc(`${catalogueKey(trade)}.description`) : null;

  const searching = query.trim() !== "";
  const shown = visibleTrades(trades, { type, query, namesOf: (trade) => [nameOf(trade), trade.name] });
  const chosen = selectedTrades(trades, selected);
  const toggle = (slug: string) => setSelected((current) => toggleSlug(current, slug));

  const hintId = `${id}-hint`;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");

  return (
    <fieldset className="flex min-w-0 flex-col gap-4" aria-invalid={invalid} aria-describedby={describedBy}>
      <legend className={`${LABEL} mb-2`}>{legend}</legend>
      <p id={hintId} className="-mt-2 text-sm text-foreground/75">
        {t("hint")}
      </p>

      <div className="flex flex-col gap-2">
        <p aria-live="polite" className="text-sm text-foreground">
          {t("selected", { count: chosen.length })}
        </p>
        {chosen.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {chosen.map((trade) => (
              <li key={trade.slug} className="max-w-full">
                <button
                  type="button"
                  data-chip
                  aria-label={t("remove", { trade: nameOf(trade) })}
                  onClick={() => toggle(trade.slug)}
                  className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-full border border-line bg-panel pr-3 pl-4 text-sm text-foreground hover:border-foreground/40"
                >
                  <span className="truncate">{nameOf(trade)}</span>
                  <X aria-hidden className="size-4 shrink-0 text-foreground/75" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {chosen.map((trade) => (
          <input key={trade.slug} type="hidden" name="tradeSlugs" value={trade.slug} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-type`} className={LABEL}>
          {t("type")}
        </label>
        <select
          id={`${id}-type`}
          data-error-focus="tradeSlugs"
          value={type}
          onChange={(event) => {
            setType(event.target.value as TradeType);
            setQuery("");
          }}
          aria-invalid={invalid}
          aria-describedby={errorId}
          className={FIELD}
        >
          {TRADE_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`types.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-search`} className={LABEL}>
          {t("search")}
        </label>
        <input
          id={`${id}-search`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          // Enter would submit the profile form; the list already filters as you type.
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          enterKeyHint="search"
          className={FIELD}
        />
      </div>

      {searching ? (
        <p role="status" className="text-sm text-foreground/75">
          {shown.length > 0 ? t("matches", { count: shown.length }) : t("noMatches")}
        </p>
      ) : null}

      {shown.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line rounded border border-line">
          {shown.map((trade) => {
            const rowId = `${id}-${trade.slug}`;
            const description = descriptionOf(trade);
            const licence = TRADE_LICENCE[trade.slug];
            return (
              <li key={trade.slug}>
                <label className="flex min-h-12 cursor-pointer items-start gap-3 px-4 py-3 has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-ring">
                  <input
                    type="checkbox"
                    value={trade.slug}
                    checked={selected.includes(trade.slug)}
                    onChange={() => toggle(trade.slug)}
                    aria-labelledby={`${rowId}-name`}
                    aria-describedby={[description ? `${rowId}-desc` : null, `${rowId}-status`]
                      .filter(Boolean)
                      .join(" ")}
                    className="mt-0.5 size-5 shrink-0 accent-primary outline-none"
                  />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span id={`${rowId}-name`} className="text-base text-foreground">
                      {nameOf(trade)}
                    </span>
                    {description ? (
                      <span id={`${rowId}-desc`} className="text-sm text-foreground/75">
                        {description}
                      </span>
                    ) : null}
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        id={`${rowId}-status`}
                        data-status={trade.verifyNow ? "verify-now" : "coming-soon"}
                        className={`font-mono text-[11px] tracking-wider uppercase ${
                          trade.verifyNow ? "text-primary" : "text-foreground/60"
                        }`}
                      >
                        {trade.verifyNow ? t("verifyNow") : t("verifyLater")}
                      </span>
                      {licence ? (
                        <span className="text-xs text-foreground/60">{t("licence", { regulator: licence })}</span>
                      ) : null}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      {error}
    </fieldset>
  );
}
