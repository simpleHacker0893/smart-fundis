import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { nameLookup } from "./lib/assessmentNames";
import { getFundiProfile, requireFundi, requireStoredUser } from "./lib/auth";
import { latestDecision } from "./lib/decisions";
import { cleanTradeSlugs, parseFundiProfile, type FundiProfileErrors } from "./lib/fundiProfile";
import {
  parseShowcaseLink,
  parseShowcaseLinkFor,
  SHOWCASE_KINDS,
  type SavedShowcaseLink,
  type ShowcaseKind,
  type ShowcaseSlotError,
} from "./lib/showcaseLinks";

/**
 * The minimal onboarding form (#37): name, phone, one or more of the 62
 * Trades (operator change on #37, D-24) and county. A Trade need not be
 * "Verify now" to be declared. Creating the profile makes the caller a Fundi
 * (ADR-18).
 *
 * Guard: a signed-in User whose users row exists (users.store has run). Who
 * the profile belongs to comes only from the token; there is no userId arg.
 *
 * Errors (ConvexError data):
 * - `{ code: "no_user" }`: users.store has not run yet;
 * - `{ code: "already_exists" }`: the caller already has a Fundi profile;
 * - `{ code: "invalid", fields }`: field codes from FundiProfileErrors;
 *   `fields.tradeSlugs` is "required" (none chosen) or "unknown" (a slug not
 *   in `trades`, or more than the catalogue has).
 */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    tradeSlugs: v.array(v.string()),
    county: v.string(),
  },
  returns: v.id("fundiProfiles"),
  handler: async (ctx, args) => {
    const { user } = await requireStoredUser(ctx);

    if ((await getFundiProfile(ctx, user._id)) !== null) {
      throw new ConvexError({ code: "already_exists", message: "You already have a Fundi profile." });
    }

    const parsed = parseFundiProfile(args);
    const fields: FundiProfileErrors = parsed.ok ? {} : { ...parsed.errors };
    if (!fields.tradeSlugs) {
      // Checked even when another field failed, so every error shows at once.
      // At most FUNDI_PROFILE_LIMITS.tradesMax indexed reads.
      for (const slug of cleanTradeSlugs(args.tradeSlugs) ?? []) {
        const trade = await ctx.db
          .query("trades")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        if (trade === null) {
          fields.tradeSlugs = "unknown";
          break;
        }
      }
    }
    if (!parsed.ok || Object.keys(fields).length > 0) {
      throw new ConvexError({ code: "invalid", fields });
    }

    const { name, phone, tradeSlugs, county } = parsed.value;
    await ctx.db.patch("users", user._id, { name, phone, county });
    return await ctx.db.insert("fundiProfiles", {
      userId: user._id,
      trades: tradeSlugs,
      county,
      publicListing: true,
    });
  },
});

/** A slot's new value: omitted leaves it, null or blank clears it. */
const showcaseSlotArg = v.optional(v.union(v.string(), v.null()));

/**
 * Sets the caller's Showcase links (#38, US-3.8, ADR-7): one YouTube and one
 * TikTok video link, embedded on the public profile as "Showcase — not
 * verified". They are never downloaded and never earn a Badge.
 *
 * Guard: requireFundi. Acts only on the caller's own profile; there is no
 * profile or user id arg.
 *
 * Each slot: omitted leaves it unchanged; null or "" (after trimming) clears
 * it; otherwise it must parse with lib/showcaseLinks for that slot's site, and
 * the canonical link (`link.url`) is stored in fundiProfiles.links.<slot>.
 * Other links fields (linkedin, cv, portfolio) are kept.
 *
 * Errors (ConvexError data), matching fundiProfiles.create:
 * - `{ code: "forbidden" }` / `{ code: "no_user" }` from requireFundi;
 * - `{ code: "invalid", fields }`: per slot, "unsupported", "tiktok_short" or
 *   "wrong_site". Nothing is saved when any slot is invalid.
 */
export const setShowcaseLinks = mutation({
  args: { youtube: showcaseSlotArg, tiktok: showcaseSlotArg },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile } = await requireFundi(ctx);

    const links: NonNullable<Doc<"fundiProfiles">["links"]> = { ...profile.links };
    const fields: Partial<Record<ShowcaseKind, ShowcaseSlotError>> = {};
    for (const kind of SHOWCASE_KINDS) {
      const input = args[kind];
      if (input === undefined) continue;
      if (input === null || input.trim() === "") {
        delete links[kind];
        continue;
      }
      const parsed = parseShowcaseLinkFor(kind, input);
      if (parsed.ok) links[kind] = parsed.link.url;
      else fields[kind] = parsed.error;
    }
    if (Object.keys(fields).length > 0) {
      throw new ConvexError({ code: "invalid", fields });
    }

    await ctx.db.patch("fundiProfiles", profile._id, {
      links: Object.keys(links).length > 0 ? links : undefined,
    });
    return null;
  },
});

const showcaseLinkValidator = v.union(
  v.object({ id: v.string(), url: v.string(), embedUrl: v.string() }),
  v.null(),
);

/**
 * The caller's own Showcase links, for the /fundi form: each slot is
 * `{ id, url, embedUrl }` (url is the canonical link, embedUrl the
 * youtube-nocookie or TikTok player URL) or null. Guard: requireFundi.
 */
export const myShowcaseLinks = query({
  args: {},
  returns: v.object({ youtube: showcaseLinkValidator, tiktok: showcaseLinkValidator }),
  handler: async (ctx) => {
    const { profile } = await requireFundi(ctx);
    const read = (kind: ShowcaseKind): SavedShowcaseLink | null => {
      const stored = profile.links?.[kind];
      if (stored === undefined) return null;
      // Stored links were checked on write; re-parse so the embed URL is only
      // ever built from a checked id.
      const parsed = parseShowcaseLink(stored);
      if (!parsed.ok || parsed.link.kind !== kind) return null;
      const { id, url, embedUrl } = parsed.link;
      return { id, url, embedUrl };
    };
    return { youtube: read("youtube"), tiktok: read("tiktok") };
  },
});

/** Far above the Badges one Fundi earns in the MVP; keeps getPublic bounded. */
const PUBLIC_BADGE_LIMIT = 200;

const publicProfileValidator = v.object({
  id: v.id("fundiProfiles"),
  // users.name: the display name the Fundi typed on the onboarding form.
  name: v.string(),
  county: v.string(),
  // A seeded Demo profile (CONTEXT: Demo profile), so the page can tag it.
  isDemo: v.boolean(),
  // The declared Trades, in the order the Fundi chose them.
  trades: v.array(v.object({ slug: v.string(), name: v.string() })),
  // Newest decision first.
  badges: v.array(
    v.object({
      tradeSlug: v.string(),
      tradeName: v.string(),
      taskSlug: v.string(),
      taskName: v.string(),
      decidedAt: v.number(),
    }),
  ),
});

/**
 * The public profile at /f/[id] (#42, US-5.7; spec §4 "What the public
 * profile shows"): display name, county, declared Trades and Badges.
 *
 * Guard: none, by design. This is the reader for a public page a Client
 * opens without signing in, so it reads no identity and trusts nothing but
 * the profile id. It is on the public-reader allow-list in contact.test.ts.
 *
 * Returns null when `id` is not a fundiProfiles id (garbage, or another
 * table's id: normalizeId, so it never throws), when the profile does not
 * exist, or when the Fundi is not Listed (`publicListing` off; CONTEXT
 * Listing. There is no Admin hide in V1).
 *
 * A Badge is an Assessment of this Fundi with status `approved` whose latest
 * reviews row exists and is an `approve`; `decidedAt` is that row's `at`,
 * the same derivation (lib/decisions.ts latestDecision) as listMine's
 * `decidedAt`. An approved row with no reviews row is not a Badge: only an
 * Expert approval creates one (AGENTS.md non-negotiables).
 *
 * Hides: phone, email, the users and Clerk ids, the video (URL, storage id,
 * clip name), Observations, Verdict, confidence, strengths, gaps, feedback,
 * safety flags, Liveness, the Expert and their note, the bio and Showcase
 * links (a later ticket), and every Assessment that is not approved.
 */
export const getPublic = query({
  args: { id: v.string() },
  returns: v.union(publicProfileValidator, v.null()),
  handler: async (ctx, args) => {
    const profileId = ctx.db.normalizeId("fundiProfiles", args.id);
    if (profileId === null) return null;
    const profile = await ctx.db.get("fundiProfiles", profileId);
    if (profile === null || !profile.publicListing) return null;
    const user = await ctx.db.get("users", profile.userId);
    if (user === null) return null;

    const trades = await Promise.all(
      profile.trades.map(async (slug) => {
        const trade = await ctx.db
          .query("trades")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        return { slug, name: trade?.name ?? slug };
      }),
    );

    const approved = await ctx.db
      .query("assessments")
      .withIndex("by_fundiUserId_and_status", (q) =>
        q.eq("fundiUserId", profile.userId).eq("status", "approved"),
      )
      .take(PUBLIC_BADGE_LIMIT);
    const names = nameLookup(ctx);
    const badges = (
      await Promise.all(
        approved.map(async (row) => {
          const decision = await latestDecision(ctx, row);
          if (decision === null || decision.decision !== "approve") return null;
          const { tradeSlug, tradeName, taskSlug, taskName } = await names(row);
          return { tradeSlug, tradeName, taskSlug, taskName, decidedAt: decision.at };
        }),
      )
    )
      .filter((badge) => badge !== null)
      .sort((a, b) => b.decidedAt - a.decidedAt);

    return {
      id: profile._id,
      name: user.name,
      county: profile.county,
      isDemo: user.isDemo === true,
      trades,
      badges,
    };
  },
});
