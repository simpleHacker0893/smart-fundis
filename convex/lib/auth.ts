import type { UserIdentity } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** The base role (ADR-18): `fundi` once a Fundi profile exists, else `none`. */
export type BaseRole = "fundi" | "none";

export const rolesValidator = v.object({
  base: v.union(v.literal("fundi"), v.literal("none")),
  expert: v.boolean(),
  admin: v.boolean(),
});

export type Roles = {
  base: BaseRole;
  expert: boolean;
  admin: boolean;
};

/** What requireUser loaded: the verified identity and the row, if stored. */
export type Caller = { identity: UserIdentity; user: Doc<"users"> | null };

/**
 * The one place that reads who the caller is: the verified identity and its
 * users row (null until `users.store` has created it), or null when signed
 * out. Every guard below, throwing or not, starts here.
 */
async function lookupCaller(ctx: Ctx): Promise<Caller | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
    .unique();
  return { identity, user };
}

/** Why a caller is not a Fundi, as checkFundi reports it. */
export type FundiRefusal = "not_signed_in" | "no_user" | "not_fundi";

/** The error each throwing guard raises for a refusal. */
function refusalError(code: FundiRefusal): Error {
  switch (code) {
    case "not_signed_in":
      return new Error("Not authenticated");
    case "no_user":
      return new ConvexError({
        code: "no_user",
        message: "No user row yet. Call users.store after sign-in.",
      });
    case "not_fundi":
      return new ConvexError({ code: "forbidden", message: "A Fundi profile is required." });
  }
}

/**
 * The signed-in caller, from the verified token only. Throws when there is no
 * identity. `user` is null until `users.store` has created the row.
 */
export async function requireUser(ctx: Ctx): Promise<Caller> {
  const caller = await lookupCaller(ctx);
  if (caller === null) throw refusalError("not_signed_in");
  return caller;
}

/**
 * Roles are derived on the server, never read from arguments or Clerk
 * metadata (ADR-18, spec §4). Takes the caller that requireUser already
 * loaded, so the users row is not read twice.
 * - base: `fundi` when a fundiProfiles row exists for the user, else `none`.
 * - expert: an experts row that is active with a non-empty approvedTrades.
 * - admin: the token email is on ADMIN_EMAILS AND email_verified is true.
 *   Clerk does not send `email_verified` by default: the Clerk `convex` JWT
 *   template must include `"email_verified": "{{user.email_verified}}"` (and
 *   `"email": "{{user.primary_email_address}}"`), or nobody is ever Admin.
 *   users.test.ts "refuses Admin when email_verified is false or missing"
 *   pins that behaviour.
 */
export async function getRoles(ctx: Ctx, caller: Caller): Promise<Roles> {
  const { identity, user } = caller;
  const profile = user === null ? null : await getFundiProfile(ctx, user._id);
  const expert = user === null ? null : await getActiveExpert(ctx, user._id);
  return {
    base: profile === null ? "none" : "fundi",
    expert: expert !== null,
    admin: isAdminIdentity(identity),
  };
}

/** A signed-in caller whose users row exists. */
export type StoredCaller = { identity: UserIdentity; user: Doc<"users"> };

/**
 * requireUser, plus the users row. Throws `no_user` when users.store has not
 * run yet for this identity.
 */
export async function requireStoredUser(ctx: Ctx): Promise<StoredCaller> {
  const { identity, user } = await requireUser(ctx);
  if (user === null) throw refusalError("no_user");
  return { identity, user };
}

/** A caller who is a Fundi, with their profile. */
export type FundiCaller = StoredCaller & { profile: Doc<"fundiProfiles"> };

/**
 * Whether the caller is a Fundi, without throwing, for a mutation that must
 * still write when the caller is refused (assessments.create deletes the
 * uploaded file, and a throw would roll that delete back). requireFundi is
 * this plus the throw, so both apply the same rule.
 */
export async function checkFundi(
  ctx: Ctx,
): Promise<({ ok: true } & FundiCaller) | { ok: false; code: FundiRefusal }> {
  const caller = await lookupCaller(ctx);
  if (caller === null) return { ok: false, code: "not_signed_in" };
  const { identity, user } = caller;
  if (user === null) return { ok: false, code: "no_user" };
  const profile = await getFundiProfile(ctx, user._id);
  if (profile === null) return { ok: false, code: "not_fundi" };
  return { ok: true, identity, user, profile };
}

/** The caller, who must be a Fundi (has a Fundi profile). */
export async function requireFundi(ctx: Ctx): Promise<FundiCaller> {
  const checked = await checkFundi(ctx);
  if (!checked.ok) throw refusalError(checked.code);
  const { identity, user, profile } = checked;
  return { identity, user, profile };
}

/**
 * The caller, who must be an Expert (active, with approved Trades). With
 * `tradeSlug`, the Expert must also be approved for that Trade.
 */
export async function requireExpert(
  ctx: Ctx,
  tradeSlug?: string,
): Promise<StoredCaller & { expert: Doc<"experts"> }> {
  const caller = await requireStoredUser(ctx);
  const expert = await getActiveExpert(ctx, caller.user._id);
  if (expert === null) {
    throw new ConvexError({ code: "forbidden", message: "An active Expert is required." });
  }
  if (tradeSlug !== undefined && !expert.approvedTrades.includes(tradeSlug)) {
    throw new ConvexError({
      code: "forbidden",
      message: `The Expert is not approved for the Trade "${tradeSlug}".`,
    });
  }
  return { ...caller, expert };
}

/** The user's Fundi profile, or null. */
export async function getFundiProfile(
  ctx: Ctx,
  userId: Id<"users">,
): Promise<Doc<"fundiProfiles"> | null> {
  return await ctx.db
    .query("fundiProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

/** The user's experts row when it makes them an Expert (active, with Trades), else null. */
export async function getActiveExpert(
  ctx: Ctx,
  userId: Id<"users">,
): Promise<Doc<"experts"> | null> {
  const row = await ctx.db
    .query("experts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (row === null || !row.active || row.approvedTrades.length === 0) {
    return null;
  }
  return row;
}

function isAdminIdentity(identity: UserIdentity): boolean {
  if (identity.emailVerified !== true || !identity.email) {
    return false;
  }
  const email = identity.email.trim().toLowerCase();
  return adminEmails().has(email);
}

function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}
