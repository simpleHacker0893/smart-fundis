import type { UserIdentity } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
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
 * loaded, so there is no second read; ctx is for the V1 profile lookups.
 * - base: `none` until the fundiProfiles table lands (V1).
 * - expert: false until the experts table lands.
 * - admin: the token email is on ADMIN_EMAILS AND email_verified is true.
 */
export async function getRoles(_ctx: Ctx, caller: Caller): Promise<Roles> {
  const { identity } = caller;
  return {
    base: "none",
    expert: false,
    admin: isAdminIdentity(identity),
  };
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
