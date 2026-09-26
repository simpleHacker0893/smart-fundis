"use client";

import { useTranslations } from "next-intl";
import type { ShowcaseLink } from "@convex/lib/showcaseLinks";
import { CHIP } from "@/components/ui/chip";

/**
 * One shared YouTube or TikTok video (US-3.8, ADR-7): embedded only, always
 * labelled "Showcase — not verified". The iframe src is built from a checked
 * video id (convex/lib/showcaseLinks.ts), never from the pasted URL.
 */
export function ShowcaseEmbed({ link }: { link: ShowcaseLink }) {
  const t = useTranslations("Showcase");
  return (
    <figure className="flex flex-col gap-2">
      <iframe
        src={link.embedUrl}
        title={link.kind === "youtube" ? t("youtubeTitle") : t("tiktokTitle")}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className={
          link.kind === "youtube"
            ? "aspect-video w-full rounded border border-line"
            : "aspect-[9/16] max-h-[80vh] w-full rounded border border-line"
        }
      />
      <figcaption className="flex flex-col gap-1">
        <span className={CHIP}>{t("label")}</span>
        <span className="text-sm text-foreground/75">{t("note")}</span>
      </figcaption>
    </figure>
  );
}
