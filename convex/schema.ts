import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// V0 has only `users` (architecture spec §5). Roles are derived, never stored
// here (ADR-18).
export default defineSchema({
  users: defineTable({
    // The Convex token identifier for the Clerk identity (`issuer|subject`).
    // Convex guidelines make tokenIdentifier the canonical auth key.
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    county: v.optional(v.string()),
    isDemo: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]),
});
