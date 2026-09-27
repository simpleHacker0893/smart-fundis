"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { AddVideoButton } from "@/components/add-video-sheet";
import { EmptyPanel, ScopedErrors, SkeletonRows } from "@/components/app-states";
import { PAGE_TITLE } from "@/components/ui/app-type";
import { SECONDARY_PILL } from "@/components/ui/pill";
import { StatusAnnouncer, VerificationRow } from "../verification-row";

/** D3.8: 24 rows a page, then "Show more" (never infinite scroll). */
const PAGE_SIZE = 24;

/**
 * My verifications (prompt 27): every Assessment from assessments.listMine,
 * newest first, as hairline rows. Live, so a chip changes in place and
 * StatusAnnouncer says so. The mobile Add video pill sits under the title (D2).
 */
export function VerificationList() {
  const t = useTranslations("Verifications");
  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={PAGE_TITLE}>{t("title")}</h1>
        <AddVideoButton className="lg:hidden" />
      </header>
      <ScopedErrors body={t("error.body")}>
        <ListBody />
      </ScopedErrors>
    </>
  );
}

function ListBody() {
  const t = useTranslations("Verifications");
  const list = useQuery(api.assessments.listMine, {});
  const [shown, setShown] = useState(PAGE_SIZE);
  if (list === undefined) return <SkeletonRows label={t("loading")} rows={5} />;
  if (list.length === 0) return <EmptyPanel tag={t("empty.tag")} body={t("empty.body")} />;
  return (
    <div className="flex flex-col gap-6">
      <StatusAnnouncer assessments={list} />
      <ul className="flex flex-col border-t border-line">
        {list.slice(0, shown).map((assessment) => (
          <VerificationRow key={assessment._id} assessment={assessment} />
        ))}
      </ul>
      {list.length > shown ? (
        <button type="button" className={SECONDARY_PILL} onClick={() => setShown((n) => n + PAGE_SIZE)}>
          {t("showMore")}
        </button>
      ) : null}
    </div>
  );
}
