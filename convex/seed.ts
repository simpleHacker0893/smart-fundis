import { ConvexError, v } from "convex/values";
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
 * A Rubric version is never edited in place: to change the text, add a new
 * version here and move `activeRubricId`.
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
          text: "Switches off the circuit at the breaker before touching any wires.",
          safety: true,
        },
        {
          id: "test_dead",
          text: "Uses a voltage tester on the wires to show the power is off before working.",
          safety: true,
        },
        {
          id: "terminals",
          text: "Connects each wire to the right terminal: brown (or red) to L, blue (or black) to N.",
          safety: false,
        },
        {
          id: "earth",
          text: "Connects the green-and-yellow earth wire to the earth terminal (E).",
          safety: true,
        },
        {
          id: "no_bare_copper",
          text: "Tightens every terminal screw, with no bare copper showing outside the terminals.",
          safety: false,
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
      name: "Cornrows / braiding",
      version: 1,
      items: [
        {
          id: "prep",
          text: "Starts with clean hair that is combed through and free of tangles.",
          safety: false,
        },
        {
          id: "tool_hygiene",
          text: "Uses clean combs, clips and hands throughout.",
          safety: true,
        },
        {
          id: "parting",
          text: "Makes straight, evenly spaced parts with clean lines.",
          safety: false,
        },
        {
          id: "tension",
          text: "Braids firmly without pulling at the scalp or hairline: no stretched skin or raised bumps at the roots.",
          safety: true,
        },
        {
          id: "even_braids",
          text: "Keeps each braid the same size and neatness from start to end.",
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

/**
 * Upserts the MVP Trades and their Rubrics. Safe to run any number of times:
 * - a Trade is matched by slug, and its name and category are kept current;
 * - a Rubric is matched by Trade, Task and version, and is inserted only when
 *   missing (an existing version is never rewritten);
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
      const rubricId =
        existingRubric?._id ??
        (await ctx.db.insert("rubrics", {
          tradeSlug: seed.slug,
          taskSlug: task.slug,
          taskName: task.name,
          version: task.version,
          items: task.items,
          status: "active",
        }));

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
        await ctx.db.patch("trades", tradeId, {
          name: seed.name,
          category: seed.category,
          activeRubricId: existingTrade.activeRubricId ?? rubricId,
        });
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
 * Internal, so only someone with deployment access can run it:
 * `pnpm exec convex run seed:expert '{"email":"you@example.com"}'`.
 * Never run it against production.
 */
export const expert = internalMutation({
  args: { email: v.string() },
  returns: v.id("experts"),
  handler: async (ctx, args) => {
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
    if (existing === null) {
      return await ctx.db.insert("experts", {
        userId,
        approvedTrades: [SEED_EXPERT_TRADE],
        active: true,
      });
    }
    const approvedTrades = existing.approvedTrades.includes(SEED_EXPERT_TRADE)
      ? existing.approvedTrades
      : [...existing.approvedTrades, SEED_EXPERT_TRADE];
    await ctx.db.patch("experts", existing._id, { approvedTrades, active: true });
    return existing._id;
  },
});
