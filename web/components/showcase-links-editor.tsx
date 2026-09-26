"use client";

import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { ShowcaseEmbed } from "@/components/showcase-embed";
import { FIELD, LABEL } from "@/components/ui/field-label";
import { pillClass } from "@/components/ui/pill";
import { parseShowcaseLink, type ShowcaseLinkError } from "@/lib/showcase-links";

type ErrorKey = ShowcaseLinkError | "duplicate" | "save";

/**
 * The Fundi's showcase links (US-3.8, ADR-7): paste a YouTube or TikTok
 * video link beside the in-app uploads. Each shows as a labelled embed
 * ("Showcase — not verified"); none earns a Badge. The caller owns storage:
 * `onSave` receives the whole new list (the Convex mutation, once it exists).
 */
export function ShowcaseLinksEditor({ urls, onSave }: { urls: readonly string[]; onSave: (urls: string[]) => Promise<void> }) {
  const t = useTranslations("Showcase");
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<ErrorKey | null>(null);
  const [saving, setSaving] = useState(false);

  const links = urls.flatMap((url) => {
    const parsed = parseShowcaseLink(url);
    return parsed.ok ? [parsed.link] : [];
  });

  async function save(next: string[]): Promise<boolean> {
    setSaving(true);
    try {
      await onSave(next);
      return true;
    } catch {
      setError("save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseShowcaseLink(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (links.some((l) => l.kind === parsed.link.kind && l.id === parsed.link.id)) {
      setError("duplicate");
      return;
    }
    setError(null);
    if (await save([...urls, parsed.link.url])) setValue("");
  }

  const errorId = `${id}-error`;
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {t("title")}
      </h2>
      <p className="text-base text-foreground/75">{t("intro")}</p>

      {links.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {links.map((link, i) => (
            <li key={`${link.kind}-${link.id}`} className="flex flex-col gap-2">
              <ShowcaseEmbed link={link} />
              <button
                type="button"
                aria-label={t("remove", { n: i + 1 })}
                disabled={saving}
                className={pillClass({ variant: "secondary", size: "full", className: "sm:w-auto" })}
                onClick={() => void save(urls.filter((u) => u !== link.url))}
              >
                {t("remove", { n: i + 1 })}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
        <label htmlFor={`${id}-link`} className={LABEL}>
          {t("linkLabel")}
        </label>
        <input
          id={`${id}-link`}
          type="url"
          inputMode="url"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          aria-invalid={error !== null && error !== "save" ? true : undefined}
          aria-describedby={[`${id}-hint`, error ? errorId : null].filter(Boolean).join(" ")}
          className={FIELD}
        />
        <p id={`${id}-hint`} className="text-sm text-foreground/75">
          {t("linkHint")}
        </p>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-primary">
            {t(`errors.${error}`)}
          </p>
        ) : null}
        <button type="submit" disabled={saving} className={pillClass({ variant: "primary", size: "full", className: "sm:w-auto" })}>
          {t("add")}
        </button>
      </form>
    </section>
  );
}
