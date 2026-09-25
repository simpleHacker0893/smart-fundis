import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import schema from "./schema";

/**
 * Creates or updates the caller's `users` row from the verified token. The
 * client calls it once after sign-in. It takes no arguments: who the row
 * belongs to comes only from the token (ADR-18).
 */
export const store = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const { identity, user } = await requireUser(ctx);
    const email = identity.email?.trim();
    if (!email) {
      throw new Error(
        "The sign-in token has no email claim. Add `email` to the Clerk `convex` JWT template.",
      );
    }
    const name = identity.name?.trim() ?? "";

    if (user !== null) {
      if (user.email !== email || user.name !== name) {
        await ctx.db.patch("users", user._id, { email, name });
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
 * The caller's own row, or null before `store` has run. It never takes a user
 * id, so it can only ever return the caller's row.
 */
export const me = query({
  args: {},
  returns: v.union(schema.doc("users"), v.null()),
  handler: async (ctx) => {
    const { user } = await requireUser(ctx);
    return user;
  },
});
