"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ChevronRight, Link2, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type FormEvent, type ReactNode, type Ref, use, useId, useMemo, useState } from "react";
import { cn } from "cn";
import { api } from "@convex/_generated/api";
import { parseShowcaseLink, SHOWCASE_KINDS, type ShowcaseKind, type ShowcaseSlotError } from "@convex/lib/showcaseLinks";
import { PrimaryActionButton } from "@/components/app-shell/primary-action";
import { Sheet, useSheet } from "@/components/app-shell/sheet";
import { useConnection } from "@/components/app-shell/use-connection";
import { ErrorLine } from "@/components/app-states";
import { MONO_TAG, SECTION_LABEL } from "@/components/ui/app-type";
import { useConvexAvailable } from "@/components/convex-available";
import type { SavedShowcaseLinks, ShowcaseLinksUpdate } from "@/components/showcase-links-editor";
import { FIELD, LABEL } from "@/components/ui/field-label";
import { APP_PRIMARY_PILL, SECONDARY_PILL } from "@/components/ui/pill";
import { roleFromPath } from "@/lib/app-nav";
import { isFundi } from "@/lib/page-guard";
import { isShowcaseHost, showcaseSaveErrorKey } from "@/lib/showcase-errors";

type LinkError = "host" | "empty" | "unsupported" | "tiktok_short" | "save";

/** The field keeps the neutral hairline when invalid: errors are never amber (D10). */
const LINK_FIELD = cn(FIELD, "aria-invalid:border-foreground");

/** The sheet's message for a refused link: which site first, then what kind of link. */
function linkErrorFor(error: ShowcaseSlotError, text: string): LinkError {
  if (error === "empty") return "empty";
  if (error === "tiktok_short") return "tiktok_short";
  return isShowcaseHost(text) ? "unsupported" : "host";
}

/**
 * The Add video sheet's body (prompt 26, US-3.8, ADR-7): group A goes to the
 * in-app recording (the only way to earn a Badge); group B adds a YouTube or
 * TikTok link as "Showcase — not verified". Both actions are outlined: the
 * sheet has no amber fill. The link is checked by the shared parser, saved
 * into its site's slot through fundiProfiles.setShowcaseLinks (`onSave`),
 * and never fetched; a link for a site that already has one says it
 * replaces it before saving. Offline, Add link is disabled with the reason
 * in words.
 */
export function AddVideoPanel({
  links,
  onSave,
  onNavigate,
}: {
  links: SavedShowcaseLinks | undefined;
  onSave: (update: ShowcaseLinksUpdate) => Promise<unknown>;
  onNavigate?: () => void;
}) {
  const t = useTranslations("AddVideo");
  const id = useId();
  const offline = useConnection().kind === "offline";
  const [value, setValue] = useState("");
  const [error, setError] = useState<LinkError | null>(null);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || offline) return;
    setAdded(false);
    const parsed = parseShowcaseLink(value);
    if (!parsed.ok) {
      setError(linkErrorFor(parsed.error, value));
      return;
    }
    const kind: ShowcaseKind = parsed.link.kind;
    setSaving(true);
    try {
      await onSave({ [kind]: parsed.link.url });
      setError(null);
      setValue("");
      setAdded(true);
    } catch (caught) {
      const key = showcaseSaveErrorKey(caught, kind);
      setError(key === "save" ? "save" : linkErrorFor(key, value));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = error !== null && error !== "save";
  // Saving fills the link's site slot: say so first when that slot already holds a link.
  const typed = parseShowcaseLink(value);
  const replaces: ShowcaseKind | null = typed.ok && links?.[typed.link.kind] ? typed.link.kind : null;
  const savedLinks = links ? SHOWCASE_KINDS.flatMap((kind) => (links[kind] ? [{ kind, url: links[kind].url }] : [])) : [];

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 pb-6">
      <p className="text-base text-dim">{t("intro")}</p>

      <div data-group="record" className="flex flex-col gap-2">
        <Link
          href="/fundi/record"
          onClick={onNavigate}
          className="flex min-h-12 items-center gap-3 rounded border border-line p-4 hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Video aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-base font-semibold">{t("record.title")}</span>
            <span className="text-base text-dim">{t("record.line")}</span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-dim" strokeWidth={1.5} />
        </Link>
        <p className="text-base text-dim">{t("record.note")}</p>
      </div>

      <div data-divider className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className={SECTION_LABEL}>{t("or")}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      <div data-group="link" className="flex flex-col gap-3 rounded border border-line p-4">
        <div className="flex items-start gap-3">
          <Link2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="text-base font-semibold">{t("link.title")}</h3>
            <span className={MONO_TAG}>{t("link.tag")}</span>
            <p className="text-base text-dim">{t("link.line")}</p>
          </div>
        </div>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
          <label htmlFor={`${id}-link`} className={LABEL}>
            {t("link.label")}
          </label>
          <input
            id={`${id}-link`}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder={t("link.placeholder")}
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={[`${id}-helper`, replaces ? `${id}-replaces` : null, error ? `${id}-error` : null]
              .filter(Boolean)
              .join(" ")}
            className={LINK_FIELD}
          />
          <p id={`${id}-helper`} className="text-base text-dim">
            {t("link.helper")}
          </p>
          {replaces ? (
            <p id={`${id}-replaces`} className="text-base text-foreground">
              {t(`link.replaces.${replaces}`)}
            </p>
          ) : null}
          {error ? <ErrorLine id={`${id}-error`}>{t(`errors.${error}`)}</ErrorLine> : null}
          {added ? (
            <p role="status" className="text-base">
              {t("link.added")}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving || offline}
            aria-busy={saving ? true : undefined}
            className={SECONDARY_PILL}
          >
            {offline ? t("link.offline") : saving ? t("link.adding") : t("link.add")}
          </button>
        </form>
        {savedLinks.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <p className={SECTION_LABEL}>{t("link.savedTitle")}</p>
            <ul className="flex flex-col gap-1">
              {savedLinks.map((link) => (
                <li key={link.kind} className="font-mono text-xs break-all text-foreground">
                  {link.url}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The panel wired to Convex. The Fundi-only query waits for the Fundi role, so the shell never throws. */
function ConnectedPanel({ onNavigate }: { onNavigate: () => void }) {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const fundi = me ? isFundi(me.roles) : false;
  const links = useQuery(api.fundiProfiles.myShowcaseLinks, fundi ? {} : "skip");
  const save = useMutation(api.fundiProfiles.setShowcaseLinks);
  return <AddVideoPanel links={links} onSave={save} onNavigate={onNavigate} />;
}

const noConvex = () => Promise.reject(new Error("Convex is not available"));

/**
 * The sheet itself: a bottom sheet on mobile, a 400 px popover under the
 * sidebar's pill on desktop (D2).
 */
function AddVideoSheet({ sheetRef, onNavigate }: { sheetRef: Ref<HTMLDialogElement>; onNavigate: () => void }) {
  const t = useTranslations("AddVideo");
  const convex = useConvexAvailable();
  return (
    <Sheet ref={sheetRef} title={t("title")} anchored className="lg:mt-[136px] lg:mr-auto lg:ml-4 lg:w-[400px]">
      {convex ? (
        <ConnectedPanel onNavigate={onNavigate} />
      ) : (
        <AddVideoPanel links={undefined} onSave={noConvex} onNavigate={onNavigate} />
      )}
    </Sheet>
  );
}

const AddVideoContext = createContext<{ open: () => void } | null>(null);

/**
 * Renders the one Add video sheet for every role page, outside the shell's
 * sidebar (#67). The sidebar is display:none below 1024 px, so a modal
 * <dialog> inside it would hide on a resize while the page stays inert.
 * The triggers (the sidebar pill, the rail icon, the mobile pill) only call
 * `open`. Set up once by app/(app)/layout.tsx; only Fundi routes draw the
 * sheet (nothing looks live that isn't).
 */
export function AddVideoProvider({ children }: { children: ReactNode }) {
  const { ref, open, close } = useSheet();
  const fundi = roleFromPath(usePathname() ?? "") === "fundi";
  const value = useMemo(() => ({ open }), [open]);
  return (
    <AddVideoContext value={value}>
      {children}
      {fundi ? <AddVideoSheet sheetRef={ref} onNavigate={close} /> : null}
    </AddVideoContext>
  );
}

function useAddVideo(): { open: () => void } {
  const context = use(AddVideoContext);
  if (context === null) throw new Error("Add video triggers must sit inside <AddVideoProvider>.");
  return context;
}

/**
 * The Fundi's primary action in the shell's sidebar slot (D2): the amber
 * "Add video" pill (or the rail's icon button) that opens the sheet.
 */
export function AddVideoAction() {
  const t = useTranslations("AppShell");
  const { open } = useAddVideo();
  return <PrimaryActionButton label={t("addVideo")} aria-haspopup="dialog" onClick={open} />;
}

/**
 * The mobile "Add video" pill on Home and My verifications (D2: the bottom
 * nav has no room for it). Pass `lg:hidden` so the desktop viewport keeps
 * the sidebar pill as its one amber fill.
 */
export function AddVideoButton({ className }: { className?: string }) {
  const t = useTranslations("AppShell");
  const { open } = useAddVideo();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={open}
      className={cn(APP_PRIMARY_PILL, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", className)}
    >
      {t("addVideo")}
    </button>
  );
}
