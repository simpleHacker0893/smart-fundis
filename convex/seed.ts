import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { MVP_TRADES, type TaskSeed } from "./lib/trades";

// Seeds for V1 (#37). Every function here is internal: run them from the
// Convex dashboard or `pnpm exec convex run seed:<name>`, never from a client.

const seededTradeValidator = v.object({
  slug: v.string(),
  tradeId: v.id("trades"),
  // Absent for a Trade with no Task (not "Verify now" yet).
  rubricId: v.optional(v.id("rubrics")),
});

/** True when a stored Rubric already holds exactly this Task's name and items, in order. */
function rubricMatches(stored: Doc<"rubrics">, task: TaskSeed): boolean {
  return (
    stored.taskName === task.name &&
    stored.items.length === task.items.length &&
    stored.items.every(
      (item, i) =>
        item.id === task.items[i].id &&
        item.text === task.items[i].text &&
        item.safety === task.items[i].safety,
    )
  );
}

/**
 * Upserts a Task's Rubric and returns its id. A Rubric is matched by Trade,
 * Task and version. A missing one is inserted. A stored one whose taskName or
 * items differ is rewritten in place only while no Assessment references it;
 * otherwise this throws `rubric_frozen` (add a new version instead).
 */
async function upsertRubric(ctx: MutationCtx, tradeSlug: string, task: TaskSeed): Promise<Id<"rubrics">> {
  const existing = await ctx.db
    .query("rubrics")
    .withIndex("by_tradeSlug_and_taskSlug_and_version", (q) =>
      q.eq("tradeSlug", tradeSlug).eq("taskSlug", task.slug).eq("version", task.version),
    )
    .unique();
  if (existing === null) {
    return await ctx.db.insert("rubrics", {
      tradeSlug,
      taskSlug: task.slug,
      taskName: task.name,
      version: task.version,
      items: task.items,
      status: "active",
    });
  }
  if (!rubricMatches(existing, task)) {
    const referenced = await ctx.db
      .query("assessments")
      .withIndex("by_rubricId", (q) => q.eq("rubricId", existing._id))
      .first();
    if (referenced !== null) {
      throw new ConvexError({
        code: "rubric_frozen",
        message:
          `Rubric ${tradeSlug}/${task.slug} v${task.version} is referenced by an Assessment ` +
          "and differs from MVP_TRADES. Add a new version instead of editing this one.",
      });
    }
    await ctx.db.patch("rubrics", existing._id, { taskName: task.name, items: task.items });
  }
  return existing._id;
}

/**
 * Upserts all 12 Trades (MVP_TRADES) and the Rubrics of the two that have a
 * Task. Safe to run any number of times. It is reference data that
 * production needs too, so unlike seed.expert it is not behind
 * ALLOW_DEV_SEED; it cannot grant any role.
 * - a Trade is matched by slug; its name and category are patched only when
 *   they changed;
 * - a Trade with a Task gets its Rubric upserted (see upsertRubric). A throw
 *   there rolls back the whole run, so nothing is written;
 * - `activeRubricId` is set only when the Trade has none, so a newer Rubric
 *   an Admin activated is not rolled back. A Trade with no Task gets no
 *   Rubric and no activeRubricId, so trades.list says verifyNow false.
 */
export const trades = internalMutation({
  args: {},
  returns: v.array(seededTradeValidator),
  handler: async (ctx) => {
    const seeded = [];
    for (const seed of MVP_TRADES) {
      const rubricId = seed.task === undefined ? undefined : await upsertRubric(ctx, seed.slug, seed.task);

      const existingTrade = await ctx.db
        .query("trades")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();
      let tradeId: Id<"trades">;
      if (existingTrade === null) {
        tradeId = await ctx.db.insert("trades", {
          slug: seed.slug,
          name: seed.name,
          category: seed.category,
          ...(rubricId !== undefined ? { activeRubricId: rubricId } : {}),
        });
      } else {
        tradeId = existingTrade._id;
        const patch = {
          ...(existingTrade.name !== seed.name ? { name: seed.name } : {}),
          ...(existingTrade.category !== seed.category ? { category: seed.category } : {}),
          ...(existingTrade.activeRubricId === undefined && rubricId !== undefined
            ? { activeRubricId: rubricId }
            : {}),
        };
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch("trades", tradeId, patch);
        }
      }
      seeded.push({ slug: seed.slug, tradeId, ...(rubricId !== undefined ? { rubricId } : {}) });
    }
    return seeded;
  },
});

/** The Trade the dev-seeded Expert is approved for (spec #36 decision 5). */
const SEED_EXPERT_TRADE = "electrical";

/**
 * DEV ONLY. Makes the User with this email an active Expert approved for
 * Electrical, so V1 can be demoed before the V4 application flow exists.
 * The User must have signed in once (users.store ran). Idempotent: an
 * existing experts row is reactivated and keeps its other Trades.
 * Internal, so only someone with deployment access can run it, and it throws
 * `forbidden` unless the deployment env var ALLOW_DEV_SEED is exactly "true".
 * Set that on dev only (`pnpm exec convex env set ALLOW_DEV_SEED true`), never
 * on production. Then:
 * `pnpm exec convex run seed:expert '{"email":"you@example.com"}'`.
 *
 * Writes one auditLog row per run. auditLog.actorUserId must be a users id and
 * an internal run has no caller, so the actor is the target User themself and
 * the reason names the dev seed.
 */
export const expert = internalMutation({
  args: { email: v.string() },
  returns: v.id("experts"),
  handler: async (ctx, args) => {
    if (process.env.ALLOW_DEV_SEED !== "true") {
      throw new ConvexError({
        code: "forbidden",
        message: "seed.expert is dev only. Set ALLOW_DEV_SEED=true on this deployment to run it.",
      });
    }
    const email = args.email.trim().toLowerCase();
    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .take(2);
    if (users.length === 0) {
      throw new ConvexError({
        code: "no_user",
        message: `No user with email ${email}. Sign in once so users.store creates the row.`,
      });
    }
    if (users.length > 1) {
      throw new ConvexError({ code: "ambiguous", message: `More than one user has email ${email}.` });
    }
    const userId = users[0]._id;

    const existing = await ctx.db
      .query("experts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    let expertId: Id<"experts">;
    if (existing === null) {
      expertId = await ctx.db.insert("experts", {
        userId,
        approvedTrades: [SEED_EXPERT_TRADE],
        active: true,
      });
    } else {
      expertId = existing._id;
      const approvedTrades = existing.approvedTrades.includes(SEED_EXPERT_TRADE)
        ? existing.approvedTrades
        : [...existing.approvedTrades, SEED_EXPERT_TRADE];
      await ctx.db.patch("experts", expertId, { approvedTrades, active: true });
    }
    await ctx.db.insert("auditLog", {
      actorUserId: userId,
      action: "seed.expert",
      targetTable: "experts",
      targetId: expertId,
      reason: `Dev seed (ALLOW_DEV_SEED): active Expert for ${SEED_EXPERT_TRADE}.`,
      at: Date.now(),
    });
    return expertId;
  },
});
