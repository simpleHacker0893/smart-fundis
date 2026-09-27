import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireExpert } from "./lib/auth";
import { nameLookup, namesFields } from "./lib/assessmentNames";
import { verdictValidator } from "./lib/validators";

// The Expert queue and decision (#41). Architecture spec §4 (canDecide) and
// §5 (status table: awaiting_review -> approved | reshoot | rejected by an
// eligible Expert; every decision writes a `reviews` and an `auditLog` row).

/** The most rows the queue returns; far above one Expert's day in the MVP. */
const QUEUE_LIMIT = 50;

const queueRowValidator = v.object({
  assessmentId: v.id("assessments"),
  _creationTime: v.number(),
  ...namesFields,
  // The AI's recommendation (never a decision). Present once the AI has run.
  verdict: v.optional(verdictValidator),
  safetyFlagCount: v.number(),
});

/**
 * US-5.1: the `awaiting_review` Assessments an Expert may decide, oldest
 * first (at most 50): only Trades in the caller's approvedTrades, never the
 * caller's own Assessments, never a Demo Fundi's. No video URL and no phone:
 * reviews.detail is the only query that returns the video.
 * Guard: requireExpert (an active Expert, roles derived server-side).
 */
export const queue = query({
  args: {},
  returns: v.array(queueRowValidator),
  handler: async (ctx) => {
    const { user, expert } = await requireExpert(ctx);
    // CONTEXT "Demo Fundi": Demo Assessments never enter an Expert's queue.
    const demo = new Map<Id<"users">, Promise<boolean>>();
    const isDemo = (fundiUserId: Id<"users">) => {
      let known = demo.get(fundiUserId);
      if (known === undefined) {
        known = ctx.db.get("users", fundiUserId).then((u) => u?.isDemo === true);
        demo.set(fundiUserId, known);
      }
      return known;
    };
    // One index range per approved Trade, each already oldest first; merged below.
    const perTrade = await Promise.all(
      expert.approvedTrades.map(async (tradeSlug) => {
        const rows: Doc<"assessments">[] = [];
        const range = ctx.db
          .query("assessments")
          .withIndex("by_status_and_tradeSlug", (q) =>
            q.eq("status", "awaiting_review").eq("tradeSlug", tradeSlug),
          );
        for await (const row of range) {
          if (row.fundiUserId === user._id || (await isDemo(row.fundiUserId))) continue;
          rows.push(row);
          if (rows.length >= QUEUE_LIMIT) break;
        }
        return rows;
      }),
    );
    const merged = perTrade
      .flat()
      .sort((a, b) => a._creationTime - b._creationTime)
      .slice(0, QUEUE_LIMIT);
    const names = nameLookup(ctx);
    return await Promise.all(
      merged.map(async (row) => ({
        assessmentId: row._id,
        _creationTime: row._creationTime,
        ...(await names(row)),
        ...(row.verdict !== undefined ? { verdict: row.verdict } : {}),
        safetyFlagCount: row.safetyFlags?.length ?? 0,
      })),
    );
  },
});
