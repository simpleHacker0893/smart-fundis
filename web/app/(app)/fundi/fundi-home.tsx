"use client";

import { useQuery } from "convex/react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { cn } from "cn";
import { api } from "@convex/_generated/api";
import { AddVideoButton } from "@/components/add-video-sheet";
import { CardBoundary, EmptyPanel, ErrorPanel, ScopedErrors, SkeletonCard, SkeletonRows } from "@/components/app-states";
import { BadgeLine } from "@/components/badge-line";
import { PAGE_TITLE, PANEL, SECTION_LABEL } from "@/components/ui/app-type";
import { SECONDARY_PILL } from "@/components/ui/pill";
import { StatusChip } from "@/components/ui/status-chip";
import { badgeOf, StatusAnnouncer, VerificationRow } from "./verification-row";

/** Home shows the newest three; "See all" opens the full list. */
const HOME_ROWS = 3;

/**
 * The Fundi home (prompt 25, #67): the title and one dim line, the mobile
 * Add video pill, then MY VERIFICATIONS and YOUR BADGES on the left and the
 * LISTING STATUS and FINISH YOUR PROFILE cards on the right from 1024 px.
 * Each card reads its own live query inside its own error boundary, so one
 * failure stays in its card (D9). Mount it behind FundiGuard: the queries
 * throw for a non-Fundi.
 */
export function FundiHome() {
  const t = useTranslations("FundiPage");
  const v = useTranslations("Verifications");
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className={PAGE_TITLE}>{t("title")}</h1>
        <p className="text-base text-dim">{t("intro")}</p>
        {/* Mobile only: on desktop the sidebar pill is the viewport's one amber fill (D2). */}
        <AddVideoButton className="lg:hidden" />
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8 lg:gap-12">
          <ScopedErrors body={v("error.body")}>
            <MyVerifications />
          </ScopedErrors>
          <ScopedErrors body={v("error.cardBody")}>
            <YourBadges />
          </ScopedErrors>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <ListingCard />
          <ScopedErrors body={v("error.cardBody")}>
            <FinishProfile />
          </ScopedErrors>
        </div>
      </div>
    </>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <h2 id={id} className={SECTION_LABEL}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The Listing card's frame: the heading stays when its body fails. */
function ListingFrame({ children }: { children: ReactNode }) {
  const t = useTranslations("FundiHome");
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn(PANEL, "flex flex-col gap-4")}>
      <h2 id={id} className={SECTION_LABEL}>
        {t("listing.title")}
      </h2>
      {children}
    </section>
  );
}

/**
 * The LISTING STATUS card, left out entirely (heading too) while the Fundi
 * has no profile: an empty card would look like a state that isn't there.
 * A failed query keeps the heading, with the error panel inside.
 */
function ListingCard() {
  const v = useTranslations("Verifications");
  return (
    <CardBoundary
      fallback={(retry) => (
        <ListingFrame>
          <ErrorPanel body={v("error.cardBody")} onRetry={retry} />
        </ListingFrame>
      )}
    >
      <ListingStatus />
    </CardBoundary>
  );
}

function MyVerifications() {
  const t = useTranslations("FundiHome");
  const v = useTranslations("Verifications");
  const list = useQuery(api.assessments.listMine, {});
  const seeAll = (
    <Link
      href="/fundi/verifications"
      className="inline-flex min-h-12 items-center gap-1 font-mono text-xs tracking-[0.26em] text-foreground uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {t("seeAll")}
    </Link>
  );
  return (
    <Section title={t("verificationsTitle")} action={list && list.length > 0 ? seeAll : null}>
      {list === undefined ? (
        <SkeletonRows label={v("loading")} />
      ) : list.length === 0 ? (
        <EmptyPanel tag={v("empty.tag")} body={v("empty.body")} />
      ) : (
        // Live: a status change re-renders the chip in place, and the announcer says so.
        <>
          <StatusAnnouncer assessments={list} />
          <ul className="flex flex-col border-t border-line">
            {list.slice(0, HOME_ROWS).map((assessment) => (
              <VerificationRow key={assessment._id} assessment={assessment} />
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function YourBadges() {
  const t = useTranslations("FundiHome");
  const list = useQuery(api.assessments.listMine, {});
  const badges = (list ?? []).flatMap((assessment) => {
    const badge = badgeOf(assessment);
    return badge ? [{ id: assessment._id, badge }] : [];
  });
  return (
    <Section title={t("badgesTitle")}>
      {list === undefined ? (
        <SkeletonRows label={t("loading")} rows={1} />
      ) : badges.length === 0 ? (
        // CONTEXT: a fact, not a judgement. Dim text, never amber or a warning glyph.
        <p className="text-base text-dim">{t("notYetVerified")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {badges.map(({ id, badge }) => (
            <li key={id}>
              <BadgeLine badge={badge} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * The Listing (CONTEXT): Listed, with or without a Badge, or Not showing.
 * There is no Admin hide in the data yet, so "Hidden by Smart Fundis" is
 * never drawn. The Fundi can't turn the Listing on here: no mutation exists.
 */
function ListingStatus() {
  const t = useTranslations("FundiHome.listing");
  const tp = useTranslations("FundiPage.publicProfile");
  const mine = useQuery(api.fundiProfiles.myProfileId, {});
  const list = useQuery(api.assessments.listMine, {});
  if (mine === null) return null;
  if (mine === undefined || list === undefined) {
    return (
      <ListingFrame>
        <SkeletonCard label={t("title")} />
      </ListingFrame>
    );
  }
  if (!mine.publicListing) {
    return (
      <ListingFrame>
        <div className="flex flex-col gap-3">
          <StatusChip status="listing_off" />
          <p className="text-base text-dim">{t("off")}</p>
        </div>
      </ListingFrame>
    );
  }
  const verified = list.some((assessment) => badgeOf(assessment) !== null);
  return (
    <ListingFrame>
      <div className="flex flex-col gap-4">
        <StatusChip status={verified ? "listed" : "listed_unverified"} />
        <p className="text-base text-dim">{verified ? t("listed") : t("listedUnverified")}</p>
        <Link
          href={`/f/${mine.id}`}
          className={cn(SECONDARY_PILL, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-full")}
        >
          {tp("link")}
        </Link>
      </div>
    </ListingFrame>
  );
}

/**
 * Completeness as named missing items only (D3.6): never a count, bar or
 * percentage. Only "First video" can be read from today's data (listMine);
 * photo, about, area and languages need a query that returns them, so they
 * are not guessed. With nothing known to be missing, the card is left out.
 */
function FinishProfile() {
  const t = useTranslations("FundiHome.finish");
  const list = useQuery(api.assessments.listMine, {});
  const id = useId();
  if (list === undefined || list.length > 0) return null;
  return (
    <section aria-labelledby={id} className={cn(PANEL, "flex flex-col gap-3")}>
      <h2 id={id} className={SECTION_LABEL}>
        {t("title")}
      </h2>
      <p className="text-base">{t("stillToAdd")}</p>
      <ul className="flex flex-col border-t border-line">
        <li className="border-b border-line">
          <Link
            href="/fundi/record"
            className="flex min-h-12 items-center justify-between gap-4 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <span className="text-base font-semibold">{t("items.firstVideo")}</span>
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-dim" strokeWidth={1.5} />
          </Link>
        </li>
      </ul>
    </section>
  );
}
