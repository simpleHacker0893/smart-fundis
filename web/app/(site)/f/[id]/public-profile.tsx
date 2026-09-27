"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useFormatter, useTranslations } from "next-intl";
import { api } from "@convex/_generated/api";
import { CHIP } from "@/components/ui/chip";
import { LABEL } from "@/components/ui/field-label";
import { useCatalogueNames } from "@/components/use-catalogue-names";

type Profile = NonNullable<FunctionReturnType<typeof api.fundiProfiles.getPublic>>;
type Badge = Profile["badges"][number];

/**
 * The public profile body (spec §4 "What the public profile shows", V1
 * subset): name, county, declared Trades and Badges. It renders only those
 * fields by name, so nothing else the query might carry (phone, video, AI
 * output) can reach the page. A Badge is an Expert approval; with none, the
 * neutral "Not yet verified" line in dim text (CONTEXT). A Demo profile and
 * each of its Badges carry the Demo tag (CONTEXT: Demo profile).
 */
export function PublicProfile({ preloaded }: { preloaded: Preloaded<typeof api.fundiProfiles.getPublic> }) {
  const t = useTranslations("PublicProfile");
  const profile = usePreloadedQuery(preloaded);
  // It stopped being public while the page was open (Listing turned off).
  if (profile === null) return <p className="text-base text-foreground/75">{t("notAvailable")}</p>;
  return <ProfileView profile={profile} />;
}

function ProfileView({ profile }: { profile: Profile }) {
  const t = useTranslations("PublicProfile");
  const names = useCatalogueNames();

  return (
    <article className="flex flex-col gap-6" aria-labelledby="profile-name">
      <header className="flex flex-col gap-2">
        {profile.isDemo ? (
          <span data-testid="demo-tag" className={CHIP}>
            {t("demoTag")}
          </span>
        ) : null}
        <h1 id="profile-name" className="text-3xl font-semibold tracking-tight break-words">
          {profile.name}
        </h1>
        <p data-testid="county" className="flex flex-wrap items-baseline gap-x-2">
          <span className={LABEL}>{t("county")}</span>
          <span className="text-base break-words">{profile.county}</span>
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="profile-trades">
        <h2 id="profile-trades" className="text-xl font-semibold">
          {t("tradesTitle")}
        </h2>
        <ul className="flex flex-col gap-1">
          {profile.trades.map((trade) => (
            <li key={trade.slug} data-testid="trade" className="text-base break-words">
              {names.trade(trade.slug, trade.name)}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="profile-badges">
        <h2 id="profile-badges" className="text-xl font-semibold">
          {t("badgesTitle")}
        </h2>
        {profile.badges.length === 0 ? (
          // CONTEXT: a fact, not a judgement. Dim text, never amber or a warning glyph.
          <p data-testid="not-yet-verified" className="text-base text-foreground/60">
            {t("notYetVerified")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {profile.badges.map((badge) => (
              <BadgeItem
                key={`${badge.tradeSlug}/${badge.taskSlug}/${badge.decidedAt}`}
                badge={badge}
                isDemo={profile.isDemo}
              />
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function BadgeItem({ badge, isDemo }: { badge: Badge; isDemo: boolean }) {
  const t = useTranslations("PublicProfile");
  const format = useFormatter();
  const names = useCatalogueNames();

  return (
    <li data-testid="badge" className="flex flex-col gap-2 rounded border border-line p-4">
      {/* The same line as the Fundi's own list (AssessmentList.badgeLine), dated in Africa/Nairobi. */}
      <span data-testid="badge-line" className="text-base font-medium break-words">
        {t("badgeLine", {
          trade: names.trade(badge.tradeSlug, badge.tradeName),
          task: names.task(badge.taskSlug, badge.taskName),
          date: format.dateTime(badge.decidedAt, { dateStyle: "medium" }),
        })}
      </span>
      {isDemo ? <span className={CHIP}>{t("demoTag")}</span> : null}
    </li>
  );
}
