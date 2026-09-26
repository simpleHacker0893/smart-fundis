"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { api } from "@convex/_generated/api";
import { validateContact, type ContactErrors } from "@convex/lib/contact";
import { pillClass } from "@/components/ui/pill";

// The picker offers three roles; the table also accepts "expert" (#29).
const ROLES = ["client", "fundi", "other"] as const;
const FIELDS = ["name", "contact", "topic", "message"] as const;
type Field = (typeof FIELDS)[number];

const FIELD =
  "min-h-12 w-full rounded border border-line bg-background px-4 text-base text-foreground placeholder:text-foreground/50 focus-visible:border-foreground/40 aria-invalid:border-primary";
const LABEL = "font-mono text-xs tracking-widest text-foreground/75 uppercase";
const ERROR = "text-sm text-primary";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "failed"; reason: "throttled" | "failed" };

// Every error the shared validator can return, mapped to its en.json key.
const ERROR_KEYS = {
  name: { required: "nameRequired", tooLong: "nameTooLong" },
  contact: { required: "contactRequired", invalid: "contactInvalid" },
  topic: { required: "topicRequired", tooLong: "topicTooLong" },
  message: { required: "messageRequired", tooShort: "messageTooShort", tooLong: "messageTooLong" },
} as const satisfies { [F in Field]: Record<NonNullable<ContactErrors[F]>, string> };

type ErrorKey = {
  [F in Field]: (typeof ERROR_KEYS)[F][keyof (typeof ERROR_KEYS)[F]];
}[Field];

function errorKey<F extends Field>(field: F, code: NonNullable<ContactErrors[F]>): ErrorKey {
  const keys: Partial<Record<string, ErrorKey>> = ERROR_KEYS[field];
  return keys[code]!;
}

/**
 * The /contact form (#29), on the 06-contact-v3-responsive instrument panel.
 * It sends to Convex `contact.send`, which stores the message; the success
 * line says only that, with no reply time. Field errors use the same rules as
 * the server (convex/lib/contact.ts). The hidden `website` field is a honeypot.
 */
export function ConvexContactForm({ to }: { to: string }) {
  const t = useTranslations("Contact.form");
  const id = useId();
  const send = useMutation(api.contact.send);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? "");
    const input = {
      name: value("name").trim(),
      contact: value("contact").trim(),
      role: value("role"),
      topic: value("topic").trim(),
      message: value("message").trim(),
    };

    const found = validateContact(input);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus({ kind: "idle" });
      const first = found.role && !found.name && !found.contact ? "role" : FIELDS.find((f) => found[f]);
      form.querySelector<HTMLElement>(`[name="${first ?? "role"}"]`)?.focus();
      return;
    }

    setStatus({ kind: "sending" });
    try {
      await send({ ...input, website: value("website") });
      setStatus({ kind: "sent" });
    } catch (error) {
      const throttled =
        error instanceof ConvexError && (error.data as { code?: string } | undefined)?.code === "throttled";
      setStatus({ kind: "failed", reason: throttled ? "throttled" : "failed" });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="flex flex-col gap-3 rounded border border-line bg-panel p-5 sm:p-6">
        <p className="text-base text-foreground">{t("success")}</p>
        <p className="font-mono text-xs tracking-wider text-foreground/75 uppercase">{t("note")}</p>
      </div>
    );
  }

  const describe = (field: Field, hint?: boolean) =>
    [errors[field] ? `${id}-${field}-error` : null, hint ? `${id}-${field}-hint` : null].filter(Boolean).join(" ") ||
    undefined;

  const fieldError = (field: Field) => {
    const code = errors[field];
    return code ? (
      <p id={`${id}-${field}-error`} className={ERROR}>
        {t(`errors.${errorKey(field, code)}`)}
      </p>
    ) : null;
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded border border-line bg-panel p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-name`} className={LABEL}>
            {t("name")}
          </label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={200}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describe("name")}
            className={FIELD}
          />
          {fieldError("name")}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-contact`} className={LABEL}>
            {t("contact")}
          </label>
          <input
            id={`${id}-contact`}
            name="contact"
            type="text"
            inputMode="email"
            autoComplete="email"
            maxLength={300}
            aria-invalid={errors.contact ? true : undefined}
            aria-describedby={describe("contact", true)}
            className={FIELD}
          />
          <p id={`${id}-contact-hint`} className="text-sm text-foreground/75">
            {t("contactHint")}
          </p>
          {fieldError("contact")}
        </div>
      </div>

      <fieldset
        className="flex flex-col gap-2"
        aria-invalid={errors.role ? true : undefined}
        aria-describedby={errors.role ? `${id}-role-error` : undefined}
      >
        <legend className={`${LABEL} mb-2`}>{t("roleLegend")}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ROLES.map((role) => (
            <div key={role} className="relative">
              <input
                id={`${id}-role-${role}`}
                type="radio"
                name="role"
                value={role}
                className="peer absolute inset-0 opacity-0"
              />
              <label
                htmlFor={`${id}-role-${role}`}
                className="flex min-h-12 cursor-pointer items-center justify-center rounded border border-line px-4 text-base peer-checked:border-primary peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-ring"
              >
                {t(`roles.${role}`)}
              </label>
            </div>
          ))}
        </div>
        {errors.role ? (
          <p id={`${id}-role-error`} className={ERROR}>
            {t("errors.roleInvalid")}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-topic`} className={LABEL}>
          {t("topic")}
        </label>
        <input
          id={`${id}-topic`}
          name="topic"
          type="text"
          maxLength={300}
          aria-invalid={errors.topic ? true : undefined}
          aria-describedby={describe("topic")}
          className={FIELD}
        />
        {fieldError("topic")}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-message`} className={LABEL}>
          {t("message")}
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          maxLength={2400}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describe("message", true)}
          className={`${FIELD} py-3`}
        />
        <p id={`${id}-message-hint`} className="text-sm text-foreground/75">
          {t("messageHint")}
        </p>
        {fieldError("message")}
      </div>

      {/* Honeypot: off-screen, out of the tab order and hidden from assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>{t("honeypot")}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.kind === "failed" ? (
        <p role="alert" className={ERROR}>
          {status.reason === "throttled" ? t("errors.throttled") : t("errors.failed", { email: to })}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status.kind === "sending"}
        aria-busy={status.kind === "sending" ? true : undefined}
        className={pillClass({ variant: "primary", size: "full" })}
      >
        {status.kind === "sending" ? t("sending") : t("send")}
      </button>
      <p className="text-center font-mono text-xs tracking-wider text-foreground/75 uppercase">{t("note")}</p>
    </form>
  );
}
