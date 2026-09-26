"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { api } from "@convex/_generated/api";
import { KENYAN_COUNTIES } from "@convex/lib/counties";
import { FUNDI_PROFILE_LIMITS, parseFundiProfile } from "@convex/lib/fundiProfile";
import { useConvexAvailable } from "@/components/convex-available";
import { pillClass } from "@/components/ui/pill";
import { AFTER_AUTH_PATH } from "@/lib/auth-routes";
import {
  fieldErrorKeys,
  PROFILE_FIELDS,
  submitErrorOutcome,
  type FieldErrorKeys,
  type FormErrorKey,
  type ProfileField,
} from "@/lib/onboarding-errors";
import type { TradeSlug } from "@/lib/trades";

const FIELD =
  "min-h-12 w-full rounded border border-line bg-background px-4 text-base text-foreground focus-visible:border-foreground/40 aria-invalid:border-primary";
const LABEL = "font-mono text-xs tracking-widest text-foreground/75 uppercase";
const ERROR = "text-sm text-primary";

/**
 * The minimal Fundi profile form (#37, spec #36 decision 2): name, phone, one
 * Trade and county. Inline errors use the same rules as the server
 * (convex/lib/fundiProfile.ts); the server's error codes map to the same
 * keys. On success, or if a profile already exists, it goes to /dashboard,
 * which routes by role.
 */
export function OnboardingForm() {
  const t = useTranslations("Onboarding");
  // Convex hooks throw outside a Convex provider (a build with no Convex URL).
  if (!useConvexAvailable()) return <p className="text-base text-foreground/75">{t("unavailable")}</p>;
  return <LoadedForm />;
}

function LoadedForm() {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const trades = useQuery(api.trades.list, isAuthenticated ? {} : "skip");
  const hasProfile = me?.roles.base === "fundi";

  useEffect(() => {
    if (hasProfile) router.replace(AFTER_AUTH_PATH);
  }, [hasProfile, router]);

  if (me === undefined || trades === undefined || hasProfile) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-3">
        <span className="text-base text-foreground/75">{t("loading")}</span>
        <span aria-hidden="true" className="h-12 w-full animate-pulse rounded bg-panel motion-reduce:animate-none" />
      </div>
    );
  }
  if (trades.length === 0) return <p className="text-base text-foreground/75">{t("noTrades")}</p>;
  return <ProfileForm trades={trades} />;
}

type TradeOption = { slug: string; name: string };

function ProfileForm({ trades }: { trades: TradeOption[] }) {
  const t = useTranslations("Onboarding");
  const tradeNames = useTranslations("Landing.trades.names");
  const id = useId();
  const router = useRouter();
  const create = useMutation(api.fundiProfiles.create);
  const [errors, setErrors] = useState<FieldErrorKeys>({});
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const [saving, setSaving] = useState(false);

  const tradeLabel = (trade: TradeOption) =>
    tradeNames.has(trade.slug as TradeSlug) ? tradeNames(trade.slug as TradeSlug) : trade.name;

  function focusFirstError(form: HTMLFormElement, found: FieldErrorKeys) {
    const first = PROFILE_FIELDS.find((field) => found[field]);
    if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (key: ProfileField) => String(data.get(key) ?? "");
    const input = { name: value("name"), phone: value("phone"), tradeSlug: value("tradeSlug"), county: value("county") };

    setFormError(null);
    const parsed = parseFundiProfile(input);
    if (!parsed.ok) {
      const found = fieldErrorKeys(parsed.errors);
      setErrors(found);
      focusFirstError(form, found);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await create(input);
      router.replace(AFTER_AUTH_PATH);
    } catch (error) {
      const outcome = submitErrorOutcome(error);
      if (outcome.kind === "alreadyExists") {
        router.replace(AFTER_AUTH_PATH);
        return;
      }
      setSaving(false);
      if (outcome.kind === "invalid") {
        setErrors(outcome.fields);
        focusFirstError(form, outcome.fields);
      } else {
        setFormError(outcome.key);
      }
    }
  }

  const errorId = (field: ProfileField) => `${id}-${field}-error`;
  const invalid = (field: ProfileField) => (errors[field] ? true : undefined);
  const describe = (field: ProfileField, hint?: boolean) =>
    [errors[field] ? errorId(field) : null, hint ? `${id}-${field}-hint` : null].filter(Boolean).join(" ") ||
    undefined;
  const fieldError = (field: ProfileField) => {
    const key = errors[field];
    return key ? (
      <p id={errorId(field)} className={ERROR}>
        {t(`errors.${key}`, { max: FUNDI_PROFILE_LIMITS.nameMax })}
      </p>
    ) : null;
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-name`} className={LABEL}>
          {t("name")}
        </label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          maxLength={FUNDI_PROFILE_LIMITS.rawMax}
          aria-invalid={invalid("name")}
          aria-describedby={describe("name")}
          className={FIELD}
        />
        {fieldError("name")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-phone`} className={LABEL}>
          {t("phone")}
        </label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={FUNDI_PROFILE_LIMITS.rawMax}
          aria-invalid={invalid("phone")}
          aria-describedby={describe("phone", true)}
          className={FIELD}
        />
        <p id={`${id}-phone-hint`} className="text-sm text-foreground/75">
          {t("phoneHint")}
        </p>
        {fieldError("phone")}
      </div>

      <fieldset
        className="flex flex-col gap-2"
        aria-invalid={invalid("tradeSlug")}
        aria-describedby={describe("tradeSlug")}
      >
        <legend className={`${LABEL} mb-2`}>{t("trade")}</legend>
        {trades.map((trade) => (
          <div key={trade.slug} className="relative">
            <input
              id={`${id}-trade-${trade.slug}`}
              type="radio"
              name="tradeSlug"
              value={trade.slug}
              className="peer absolute inset-0 opacity-0"
            />
            <label
              htmlFor={`${id}-trade-${trade.slug}`}
              className="flex min-h-12 cursor-pointer items-center rounded border border-line px-4 text-base peer-checked:border-primary peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-ring"
            >
              {tradeLabel(trade)}
            </label>
          </div>
        ))}
        {fieldError("tradeSlug")}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-county`} className={LABEL}>
          {t("county")}
        </label>
        <select
          id={`${id}-county`}
          name="county"
          defaultValue=""
          aria-invalid={invalid("county")}
          aria-describedby={describe("county")}
          className={FIELD}
        >
          <option value="" disabled>
            {t("countyPlaceholder")}
          </option>
          {KENYAN_COUNTIES.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
        {fieldError("county")}
      </div>

      {formError ? (
        <p role="alert" className={ERROR}>
          {t(`errors.${formError}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving ? true : undefined}
        className={pillClass({ variant: "primary", size: "full", className: "sm:w-auto" })}
      >
        {saving ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
