import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getFundiProfile, getRoles, requireUser, rolesValidator } from "./lib/auth";
import schema from "./schema";

/**
 * Creates or updates the caller's `users` row from the verified token. The
 * client calls it once per session after sign-in. It takes no arguments: who
 * the row belongs to comes only from the token (ADR-18).
 */
export const store = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const { identity, user } = await requireUser(ctx);
    // Display only: never used for authorization (Admin reads the token).
    const email = identity.email?.trim().toLowerCase();
    if (!email) {
      throw new Error(
        "The sign-in token has no email claim. Add `email` to the Clerk `convex` JWT template.",
      );
    }
    const name = identity.name?.trim() ?? "";

    if (user !== null) {
      // Once a Fundi profile exists, the name is the one the Fundi typed in
      // the profile form (fundiProfiles.create), so the token no longer sets it.
      const ownsName = (await getFundiProfile(ctx, user._id)) === null;
      const patch = {
        ...(user.email !== email ? { email } : {}),
        ...(ownsName && user.name !== name ? { name } : {}),
      };
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch("users", user._id, patch);
      }
      return user._id;
    }
    return await ctx.db.insert("users", {
      clerkId: identity.tokenIdentifier,
      email,
      name,
    });
  },
});

/**
 * The caller's own row (null before `store` has run) and their derived roles
 * (spec §4). It never takes a user id, so it can only ever describe the caller.
 */
export const me = query({
  args: {},
  returns: v.object({
    user: v.union(schema.doc("users"), v.null()),
    roles: rolesValidator,
  }),
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const roles = await getRoles(ctx, caller);
    return { user: caller.user, roles };
  },
});
