"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { api } from "@convex/_generated/api";
import { KENYAN_COUNTIES } from "@convex/lib/counties";
import { FUNDI_PROFILE_LIMITS, parseFundiProfile } from "@convex/lib/fundiProfile";
import { useConvexAvailable } from "@/components/convex-available";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { FIELD, LABEL } from "@/components/ui/field-label";
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
import type { PickerTrade } from "@/lib/trade-picker";
import { TradePicker } from "./trade-picker";

const ERROR = "text-sm text-primary";

/**
 * The minimal Fundi profile form (#37): name, phone, one or more Trades
 * (operator changes 1 and 2: any of the 62 catalogue Trades) and county. Inline errors use the same rules as the server
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

  // `me` is null when signed out: treat it like loading.
  if (!me || trades === undefined || hasProfile) return <LoadingSkeleton label={t("loading")} />;
  if (trades.length === 0) return <p className="text-base text-foreground/75">{t("noTrades")}</p>;
  return <ProfileForm trades={trades} />;
}

function ProfileForm({ trades }: { trades: readonly PickerTrade[] }) {
  const t = useTranslations("Onboarding");
  const id = useId();
  const router = useRouter();
  const create = useMutation(api.fundiProfiles.create);
  const store = useMutation(api.users.store);
  const [errors, setErrors] = useState<FieldErrorKeys>({});
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const [saving, setSaving] = useState(false);

  function focusFirstError(form: HTMLFormElement, found: FieldErrorKeys) {
    const first = PROFILE_FIELDS.find((field) => found[field]);
    // The Trade picker's hidden inputs can't take focus; its dropdown stands in.
    if (!first) return;
    const target =
      form.querySelector<HTMLElement>(`[data-error-focus="${first}"]`) ??
      form.querySelector<HTMLElement>(`[name="${first}"]`);
    target?.focus();
  }

  /**
   * fundiProfiles.create, storing the caller's `users` row first if the
   * server has none (`no_user`). StoreUserOnAuth writes it once per session;
   * if that call failed, or the row went missing since, the form would
   * otherwise fail the same way on every try. users.store is idempotent.
   */
  async function createProfile(input: Parameters<typeof create>[0]) {
    try {
      await create(input);
    } catch (error) {
      const outcome = submitErrorOutcome(error);
      if (outcome.kind !== "form" || outcome.key !== "noUser") throw error;
      try {
        await store({});
      } catch (storeError) {
        console.error("users.store failed", storeError);
        throw error;
      }
      await create(input);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (key: ProfileField) => String(data.get(key) ?? "");
    const input = {
      name: value("name"),
      phone: value("phone"),
      tradeSlugs: data.getAll("tradeSlugs").map(String),
      county: value("county"),
    };

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
      await createProfile(input);
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

      <TradePicker
        trades={trades}
        legend={t("trade")}
        invalid={invalid("tradeSlugs")}
        errorId={errors.tradeSlugs ? errorId("tradeSlugs") : undefined}
        error={fieldError("tradeSlugs")}
      />

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
