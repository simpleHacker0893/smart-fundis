"use client";

import { useTranslations } from "next-intl";
import { useId, type FormEvent } from "react";
import { pillClass } from "@/components/ui/pill";
import { buildMailto } from "@/lib/contact";

const ROLES = ["fundi", "client", "expert", "partner", "press"] as const;

const FIELD =
  "min-h-12 w-full rounded border border-line bg-background px-4 text-base text-foreground placeholder:text-foreground/50 focus-visible:border-foreground/40";

/**
 * The instrument-panel contact form (06-contact). There is no message
 * backend, so submitting opens the visitor's email app with the message
 * filled in (#24): the button says so, and nothing is sent by us.
 */
export function ContactForm({ to }: { to: string }) {
  const t = useTranslations("Contact.message");
  const id = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const role = t(`roles.${String(data.get("role")) as (typeof ROLES)[number]}`);
    window.location.href = buildMailto(to, { subject: t("subject", { role }), message: String(data.get("message") ?? "") });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-role`} className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
          {t("role")}
        </label>
        <select id={`${id}-role`} name="role" className={FIELD} defaultValue="fundi">
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-message`} className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
          {t("message")}
        </label>
        <textarea id={`${id}-message`} name="message" rows={5} required className={`${FIELD} py-3`} />
      </div>
      <button type="submit" className={pillClass({ variant: "primary", size: "full" })}>
        {t("send")}
      </button>
      <p className="text-center font-mono text-xs tracking-wider text-foreground/75 uppercase">{t("note")}</p>
    </form>
  );
}
