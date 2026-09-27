"use client";

import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import type { api } from "@convex/_generated/api";
import { parseShowcaseLinkFor, SHOWCASE_KINDS, type SavedShowcaseLink, type ShowcaseKind } from "@convex/lib/showcaseLinks";
import { cn } from "cn";
import { ErrorLine } from "@/components/app-states";
import { ShowcaseEmbed } from "@/components/showcase-embed";
import { FIELD, LABEL } from "@/components/ui/field-label";
import { SECONDARY_PILL } from "@/components/ui/pill";
import { showcaseSaveErrorKey, type ShowcaseErrorKey } from "@/lib/showcase-errors";

/** Both saved slots, as fundiProfiles.myShowcaseLinks returns them; null when empty. */
export type SavedShowcaseLinks = FunctionReturnType<typeof api.fundiProfiles.myShowcaseLinks>;
/** fundiProfiles.setShowcaseLinks args: an omitted slot is kept, null clears it. */
export type ShowcaseLinksUpdate = Partial<Record<ShowcaseKind, string | null>>;


/**
 * "Show your past work" on /fundi (US-3.8, ADR-7): one YouTube and one TikTok
 * video link, each shown as an embed labelled "Showcase — not verified".
 * They never earn a Badge; only an in-app video can be verified. The caller
 * owns storage: `links` is fundiProfiles.myShowcaseLinks (undefined while it
 * loads) and `onSave` calls fundiProfiles.setShowcaseLinks.
 */
export function ShowcaseLinksEditor({
  links,
  onSave,
}: {
  links: SavedShowcaseLinks | undefined;
  onSave: (update: ShowcaseLinksUpdate) => Promise<unknown>;
}) {
  const t = useTranslations("Showcase");
  const id = useId();
  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-base font-semibold">
        {t("title")}
      </h2>
      <p className="text-base text-dim">{t("intro")}</p>
      {links === undefined ? (
        <p className="text-base text-dim">{t("loading")}</p>
      ) : (
        SHOWCASE_KINDS.map((kind) => <ShowcaseSlot key={kind} kind={kind} saved={links[kind]} onSave={onSave} />)
      )}
    </section>
  );
}

function ShowcaseSlot({
  kind,
  saved,
  onSave,
}: {
  kind: ShowcaseKind;
  saved: SavedShowcaseLink | null;
  onSave: (update: ShowcaseLinksUpdate) => Promise<unknown>;
}) {
  const t = useTranslations("Showcase");
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<ShowcaseErrorKey | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(update: string | null): Promise<boolean> {
    setSaving(true);
    setDone(false);
    try {
      await onSave({ [kind]: update });
      setError(null);
      return true;
    } catch (caught) {
      setError(showcaseSaveErrorKey(caught, kind));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseShowcaseLinkFor(kind, value);
    if (!parsed.ok) {
      setDone(false);
      setError(parsed.error);
      return;
    }
    if (await save(parsed.link.url)) {
      setValue("");
      setDone(true);
    }
  }

  const message =
    error === null
      ? null
      : error === "save"
        ? t("errors.save")
        : kind === "youtube"
          ? // A TikTok short link in the YouTube box is still a TikTok link.
            t(`errors.youtube.${error === "tiktok_short" ? "wrong_site" : error}`)
          : t(`errors.tiktok.${error}`);
  const fieldError = error !== null && error !== "save";

  return (
    <div className="flex flex-col gap-3">
      {saved ? (
        <>
          <ShowcaseEmbed link={{ kind, ...saved }} />
          <button type="button" disabled={saving} className={SECONDARY_PILL} onClick={() => void save(null)}>
            {t(`slots.${kind}.remove`)}
          </button>
        </>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
        <label htmlFor={`${id}-link`} className={LABEL}>
          {t(`slots.${kind}.label`)}
        </label>
        <input
          id={`${id}-link`}
          type="url"
          inputMode="url"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={[`${id}-hint`, message ? `${id}-error` : null].filter(Boolean).join(" ")}
          className={cn(FIELD, "aria-invalid:border-foreground")}
        />
        <p id={`${id}-hint`} className="text-base break-words text-dim">
          {t(`slots.${kind}.hint`)}
        </p>
        {message ? (
          <ErrorLine id={`${id}-error`}>{message}</ErrorLine>
        ) : null}
        {done ? (
          <p role="status" className="text-base">
            {t(`slots.${kind}.saved`)}
          </p>
        ) : null}
        <button type="submit" disabled={saving} className={SECONDARY_PILL}>
          {t(`slots.${kind}.save`)}
        </button>
      </form>
    </div>
  );
}
