import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import type { RubricItem } from "./lib/validators";

// Seeds for V1 (#37). Every function here is internal: run them from the
// Convex dashboard or `pnpm exec convex run seed:<name>`, never from a client.

type TradeSeed = {
  slug: string;
  name: string;
  category: "skilled" | "semi_skilled" | "odd_job";
  task: { slug: string; name: string; version: number; items: RubricItem[] };
};

/**
 * The two MVP Trades and their Rubrics (US-3.2). The `text` is English, is
 * what the AI receives, and must be read by rai-reviewer before it ships.
 * A Rubric version that an Assessment references is frozen: to change it, add
 * a new version here and move `activeRubricId`. seed.trades enforces this (it
 * throws), and rewrites a stored version in place only while no Assessment
 * references it, which is how the rai-reviewer edits to v1 reach dev.
 */
export const MVP_TRADES: readonly TradeSeed[] = [
  {
    slug: "electrical",
    name: "Electrical",
    category: "skilled",
    task: {
      slug: "13a-socket",
      name: "Install a 13A socket",
      version: 1,
      items: [
        {
          id: "isolate",
          text: "Shows the breaker being switched off on camera before touching any wires.",
          safety: true,
        },
        {
          id: "test_dead",
          text: "Holds the voltage tester to each wire on camera so its reading or light shows the power is off.",
          safety: true,
        },
        {
          id: "terminals",
          text: "Holds each wire to the camera and connects it to the right terminal: brown (or old red) to L, blue (or old black) to N.",
          safety: true,
        },
        {
          id: "earth",
          text: "Connects the green-and-yellow earth wire to the earth terminal (E). On older installs, the bare earth wire is covered in green-and-yellow sleeving.",
          safety: true,
        },
        {
          id: "no_bare_copper",
          text: "Tightens every terminal screw and gives each wire a light pull to show it is firm. No bare copper shows outside the terminals.",
          safety: true,
        },
        {
          id: "faceplate",
          text: "Fixes the faceplate to the box straight and level, with no wires trapped.",
          safety: false,
        },
        {
          id: "function_test",
          text: "Switches the power back on and shows the socket works, with a socket tester or a plugged-in device.",
          safety: false,
        },
      ],
    },
  },
  {
    slug: "hairdressing",
    name: "Hairdressing",
    category: "skilled",
    task: {
      slug: "cornrows",
      name: "Cornrows",
      version: 1,
      items: [
        {
          id: "prep",
          text: "Detangles and sections the hair before braiding.",
          safety: false,
        },
        {
          id: "tool_hygiene",
          text: "Shows the comb and clips are clean before starting, and does not reuse a tool dropped on the floor.",
          safety: true,
        },
        {
          id: "parting",
          text: "Makes clean, even parts that follow the planned pattern (straight or curved).",
          safety: false,
        },
        {
          id: "tension",
          text: "Braids firmly but not too tight: the skin at the hairline and roots is not pulled up or stretched, and no raised bumps appear.",
          safety: true,
        },
        {
          id: "even_braids",
          text: "Keeps each braid the size planned for the style, neat from root to end.",
          safety: false,
        },
        {
          id: "neat_ends",
          text: "Finishes the ends neatly so the braids do not come loose.",
          safety: false,
        },
      ],
    },
  },
];

const seededTradeValidator = v.object({
  slug: v.string(),
  tradeId: v.id("trades"),
  rubricId: v.id("rubrics"),
});

/** True when a stored Rubric already holds exactly this Task's name and items, in order. */
function rubricMatches(stored: Doc<"rubrics">, task: TradeSeed["task"]): boolean {
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
 * Upserts the MVP Trades and their Rubrics. Safe to run any number of times.
 * It is reference data that production needs too, so unlike seed.expert it is
 * not behind ALLOW_DEV_SEED; it cannot grant any role.
 * - a Trade is matched by slug; its name and category are patched only when
 *   they changed;
 * - a Rubric is matched by Trade, Task and version. A missing one is
 *   inserted. A stored one whose taskName or items differ from MVP_TRADES is
 *   rewritten in place only while no Assessment references it; otherwise this
 *   throws `rubric_frozen` and writes nothing (add a new version instead);
 * - `activeRubricId` is set only when the Trade has none, so a newer Rubric
 *   an Admin activated is not rolled back.
 */
export const trades = internalMutation({
  args: {},
  returns: v.array(seededTradeValidator),
  handler: async (ctx) => {
    const seeded = [];
    for (const seed of MVP_TRADES) {
      const { task } = seed;
      const existingRubric = await ctx.db
        .query("rubrics")
        .withIndex("by_tradeSlug_and_taskSlug_and_version", (q) =>
          q.eq("tradeSlug", seed.slug).eq("taskSlug", task.slug).eq("version", task.version),
        )
        .unique();
      let rubricId: Id<"rubrics">;
      if (existingRubric === null) {
        rubricId = await ctx.db.insert("rubrics", {
          tradeSlug: seed.slug,
          taskSlug: task.slug,
          taskName: task.name,
          version: task.version,
          items: task.items,
          status: "active",
        });
      } else {
        rubricId = existingRubric._id;
        if (!rubricMatches(existingRubric, task)) {
          const referenced = await ctx.db
            .query("assessments")
            .withIndex("by_rubricId", (q) => q.eq("rubricId", rubricId))
            .first();
          if (referenced !== null) {
            throw new ConvexError({
              code: "rubric_frozen",
              message:
                `Rubric ${seed.slug}/${task.slug} v${task.version} is referenced by an Assessment ` +
                "and differs from MVP_TRADES. Add a new version instead of editing this one.",
            });
          }
          await ctx.db.patch("rubrics", rubricId, { taskName: task.name, items: task.items });
        }
      }

      const existingTrade = await ctx.db
        .query("trades")
        .withIndex("by_slug", (q) => q.eq("slug", seed.slug))
        .unique();
      let tradeId;
      if (existingTrade === null) {
        tradeId = await ctx.db.insert("trades", {
          slug: seed.slug,
          name: seed.name,
          category: seed.category,
          activeRubricId: rubricId,
        });
      } else {
        tradeId = existingTrade._id;
        const patch = {
          ...(existingTrade.name !== seed.name ? { name: seed.name } : {}),
          ...(existingTrade.category !== seed.category ? { category: seed.category } : {}),
          ...(existingTrade.activeRubricId === undefined ? { activeRubricId: rubricId } : {}),
        };
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch("trades", tradeId, patch);
        }
      }
      seeded.push({ slug: seed.slug, tradeId, rubricId });
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
