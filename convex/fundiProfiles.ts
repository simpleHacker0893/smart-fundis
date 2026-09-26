import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getFundiProfile, requireFundi, requireStoredUser } from "./lib/auth";
import { cleanTradeSlugs, parseFundiProfile, type FundiProfileErrors } from "./lib/fundiProfile";
import {
  parseShowcaseLink,
  parseShowcaseLinkFor,
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

const SHOWCASE_KINDS: readonly ShowcaseKind[] = ["youtube", "tiktok"];

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

    const links = { ...profile.links };
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

    const kept = Object.fromEntries(Object.entries(links).filter(([, value]) => value !== undefined));
    await ctx.db.patch("fundiProfiles", profile._id, {
      links: Object.keys(kept).length > 0 ? kept : undefined,
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
    const read = (kind: ShowcaseKind) => {
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
