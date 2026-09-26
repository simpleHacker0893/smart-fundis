import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { contactRoleValidator } from "./lib/contact";

// `users` (architecture spec §5; roles are derived, never stored here, ADR-18)
// and `contactMessages` (#29).
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

  // Messages from the /contact form (#29). Written only by contact.send; there
  // is no public read path. Admins read them in the Convex dashboard until V4.
  contactMessages: defineTable({
    name: v.string(),
    // Where to reply: a lowercased ASCII email, or a Kenyan phone as +254XXXXXXXXX.
    contact: v.string(),
    // The throttle key: contact with email +tags (and Gmail dots) folded.
    contactKey: v.string(),
    role: contactRoleValidator,
    topic: v.string(),
    message: v.string(),
    createdAt: v.number(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("closed")),
  })
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_contactKey_and_createdAt", ["contactKey", "createdAt"]),
});
