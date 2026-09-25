import type { UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** The base role (ADR-18): `fundi` once a Fundi profile exists, else `none`. */
export type BaseRole = "fundi" | "none";

export type Roles = {
  base: BaseRole;
  expert: boolean;
  admin: boolean;
};

/**
 * The signed-in caller, from the verified token only. Throws when there is no
 * identity. `user` is null until `users.store` has created the row.
 */
export async function requireUser(
  ctx: Ctx,
): Promise<{ identity: UserIdentity; user: Doc<"users"> | null }> {
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
 * metadata (ADR-18, spec §4).
 * - base: `none` until the fundiProfiles table lands (V1).
 * - expert: false until the experts table lands.
 * - admin: the token email is on ADMIN_EMAILS AND email_verified is true.
 */
export async function getRoles(ctx: Ctx): Promise<Roles> {
  const { identity } = await requireUser(ctx);
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
