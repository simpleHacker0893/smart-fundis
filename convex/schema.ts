import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// V0 has only `users` (architecture spec §5). Roles are derived, never stored
// here (ADR-18).
export default defineSchema({
  users: defineTable({
    // Holds identity.tokenIdentifier (issuer|subject), not the raw Clerk user id (D-16).
    clerkId: v.string(),
    // Display only, trimmed and lowercased by users.store. Never used for authorization.
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    isDemo: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]),
});
