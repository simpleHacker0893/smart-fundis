import type { UserIdentity } from "convex/server";
import { v } from "convex/values";
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
 * The signed-in caller, from the verified token only. Throws when there is no
 * identity. `user` is null until `users.store` has created the row.
 */
export async function requireUser(ctx: Ctx): Promise<Caller> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
    .unique();
  return { identity, user };
}

/**
 * Roles are derived on the server, never read from arguments or Clerk
 * metadata (ADR-18, spec §4). Takes the caller that requireUser already
 * loaded, so the users row is not read twice.
 * - base: `fundi` when a fundiProfiles row exists for the user, else `none`.
 * - expert: an experts row that is active with a non-empty approvedTrades.
 * - admin: the token email is on ADMIN_EMAILS AND email_verified is true.
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
