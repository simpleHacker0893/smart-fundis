import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { contactRoleValidator } from "./lib/contact";
import {
  assessmentStatusValidator,
  livenessCheckValidator,
  observationValidator,
  reshootReasonValidator,
  reviewDecisionValidator,
  reviewKindValidator,
  rubricItemValidator,
  rubricStatusValidator,
  tradeCategoryValidator,
  verdictValidator,
} from "./lib/validators";

// Architecture spec §5. Roles and Badges are derived, never stored (ADR-18).
// Index names follow the Convex rule "every field in the name"; the spec §5
// short names map as: by_trade_task -> by_tradeSlug_and_taskSlug_and_version,
// by_fundi -> by_fundiUserId_and_status, by_status_trade -> by_status_and_tradeSlug,
// by_status_claimedAt -> by_status_and_claimedAt, by_assessment ->
// by_assessmentId, by_decider -> by_deciderUserId, by_target ->
// by_targetTable_and_targetId.
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
  })
    .index("by_clerkId", ["clerkId"])
    // For internal lookups only (seed.expert). Never an authorization key.
    .index("by_email", ["email"]),

  // A Fundi profile. Its existence makes the User a Fundi (spec §4). V1 fills
  // only userId, trades (one), county and publicListing; the rest is the V3/V6
  // full profile form.
  fundiProfiles: defineTable({
    userId: v.id("users"),
    // Trade slugs the Fundi declared. At least one.
    trades: v.array(v.string()),
    county: v.string(),
    area: v.optional(v.string()),
    yearsExp: v.optional(v.number()),
    languages: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    links: v.optional(
      v.object({
        youtube: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        cv: v.optional(v.string()),
        portfolio: v.optional(v.string()),
      }),
    ),
    // "Tell me when it launches". Off by default; never consent (CONTEXT: Co-op interest).
    coopInterest: v.optional(v.boolean()),
    coopInterestAt: v.optional(v.number()),
    // "Show my profile in Find a fundi". Set to true on create.
    publicListing: v.boolean(),
  }).index("by_userId", ["userId"]),

  // An Expert: a User is one while `active` and `approvedTrades` is non-empty.
  experts: defineTable({
    userId: v.id("users"),
    approvedTrades: v.array(v.string()),
    active: v.boolean(),
  }).index("by_userId", ["userId"]),

  // A Trade is "Verify now" when it has an activeRubricId.
  trades: defineTable({
    slug: v.string(),
    name: v.string(),
    category: tradeCategoryValidator,
    activeRubricId: v.optional(v.id("rubrics")),
  }).index("by_slug", ["slug"]),

  // One versioned checklist for one Task. `text` is English and is what the AI
  // receives; the UI translates by item id (D-29, D-61).
  rubrics: defineTable({
    tradeSlug: v.string(),
    taskSlug: v.string(),
    taskName: v.string(),
    version: v.number(),
    items: v.array(rubricItemValidator),
    // Only whether this version is retired. It does NOT decide which version
    // is live: `trades.activeRubricId` is the source of truth for the Trade's
    // current Rubric and for "Verify now". Several versions may be `active`.
    status: rubricStatusValidator,
  }).index("by_tradeSlug_and_taskSlug_and_version", ["tradeSlug", "taskSlug", "version"]),

  // One attempt to prove one Task with one in-app video. V1 fields (spec §5).
  assessments: defineTable({
    // Who and what
    fundiUserId: v.id("users"),
    tradeSlug: v.string(),
    rubricId: v.id("rubrics"),
    previousAssessmentId: v.optional(v.id("assessments")),
    // Consent (verification only)
    consentVersion: v.string(),
    consentAt: v.number(),
    // The Fundi's tick "The client agreed to be filmed" (#38, third-party
    // privacy). Present, and true, only for a Task where a client may be on
    // camera (lib/trades.ts `clientOnCamera`).
    clientConsent: v.optional(v.boolean()),
    // Video: absent once deleted, and for demo rows.
    // A `_storage` ID: lib/storage.ts isStorageReferenced checks it, so a
    // rejected upload never deletes it. Any new `_storage` field on any table
    // must add its own check there.
    videoStorageId: v.optional(v.id("_storage")),
    videoDeletedAt: v.optional(v.number()),
    // Liveness
    livenessCode: v.string(),
    livenessRead: v.optional(v.string()),
    livenessCheck: v.optional(livenessCheckValidator),
    // Pipeline
    status: assessmentStatusValidator,
    attempts: v.number(),
    claimedAt: v.optional(v.number()),
    // Which worker claimed it (/ai/claim), for tracing a stuck `analyzing` row.
    claimedBy: v.optional(v.string()),
    reshootReason: v.optional(reshootReasonValidator),
    // AI result (a recommendation, never a decision)
    observations: v.optional(v.array(observationValidator)),
    verdict: v.optional(verdictValidator),
    confidence: v.optional(v.number()),
    strengths: v.optional(v.array(v.string())),
    gaps: v.optional(v.array(v.string())),
    safetyFlags: v.optional(v.array(v.string())),
    feedbackEn: v.optional(v.string()),
    feedbackSw: v.optional(v.string()),
    model: v.optional(v.string()),
    latencyMs: v.optional(v.number()),
    fallbackModel: v.optional(v.string()),
    // Appeal
    appealReason: v.optional(v.string()),
    // Kept for later: always "none" until the Pilot
    licenseStatus: v.literal("none"),
  })
    // A Fundi's own Assessments, optionally narrowed by status (eq on
    // fundiUserId alone still works as a prefix).
    .index("by_fundiUserId_and_status", ["fundiUserId", "status"])
    // assessments.listMine: a Fundi's own Assessments, newest first. The
    // status index above orders by status before _creationTime, so it cannot.
    .index("by_fundiUserId", ["fundiUserId"])
    // lib/storage.ts isStorageReferenced (assessments.create): a stored video
    // already recorded on an Assessment is never reused, and never deleted by
    // a rejected upload.
    .index("by_videoStorageId", ["videoStorageId"])
    // seed.trades: is this Rubric version referenced (then it is frozen)?
    .index("by_rubricId", ["rubricId"])
    // Convex appends _creationTime, so each status reads oldest first.
    .index("by_status", ["status"])
    .index("by_status_and_tradeSlug", ["status", "tradeSlug"])
    .index("by_status_and_claimedAt", ["status", "claimedAt"]),

  // The Liveness code a Fundi was shown and has not used yet (#38, US-3.4).
  // assessments.newLivenessCode writes it (one row per User, replaced on each
  // call) and assessments.create consumes it, so the client never picks the
  // code that is stored on the Assessment.
  livenessCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    issuedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Every Expert decision (review, appeal, Admin override).
  reviews: defineTable({
    assessmentId: v.id("assessments"),
    deciderUserId: v.id("users"),
    kind: reviewKindValidator,
    decision: reviewDecisionValidator,
    note: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_assessmentId", ["assessmentId"])
    .index("by_deciderUserId", ["deciderUserId"]),

  // Admin, override, approve and reject actions.
  auditLog: defineTable({
    actorUserId: v.id("users"),
    action: v.string(),
    targetTable: v.string(),
    targetId: v.string(),
    reason: v.optional(v.string()),
    at: v.number(),
  }).index("by_targetTable_and_targetId", ["targetTable", "targetId"]),

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
