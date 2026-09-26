import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const ANYANGO = {
  tokenIdentifier: "https://clerk.example|user_anyango",
  subject: "user_anyango",
  issuer: "https://clerk.example",
  email: "anyango@example.com",
  emailVerified: true,
  name: "Anyango Otieno",
};

function setup() {
  return convexTest(schema, modules);
}

async function tables(t: ReturnType<typeof setup>) {
  return t.run(async (ctx) => ({
    trades: await ctx.db.query("trades").take(100),
    rubrics: await ctx.db.query("rubrics").take(100),
  }));
}

describe("seed.trades (US-3.2)", () => {
  it("creates the two MVP Trades, each with an active Rubric", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});

    const { trades, rubrics } = await tables(t);
    expect(trades.map((tr) => tr.slug).sort()).toEqual(["electrical", "hairdressing"]);
    expect(rubrics).toHaveLength(2);

    for (const trade of trades) {
      const rubric = rubrics.find((r) => r._id === trade.activeRubricId);
      expect(rubric, `${trade.slug} activeRubricId`).toBeDefined();
      expect(rubric?.tradeSlug).toBe(trade.slug);
      expect(rubric?.status).toBe("active");
      expect(rubric?.version).toBe(1);
      expect(rubric?.items.length).toBeGreaterThan(0);
      expect(rubric?.items.some((i) => i.safety)).toBe(true);
      // Item ids are unique within a Rubric (rules.py matches on them).
      const ids = rubric?.items.map((i) => i.id) ?? [];
      expect(new Set(ids).size).toBe(ids.length);
    }

    const electrical = rubrics.find((r) => r.tradeSlug === "electrical");
    expect(electrical).toMatchObject({ taskSlug: "13a-socket", taskName: "Install a 13A socket" });
    const hair = rubrics.find((r) => r.tradeSlug === "hairdressing");
    expect(hair).toMatchObject({ taskSlug: "cornrows", taskName: "Cornrows / braiding" });
  });

  it("is idempotent: a second run leaves 2 Trades and 2 Rubrics, with the same ids", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});
    const first = await tables(t);
    await t.mutation(internal.seed.trades, {});
    const second = await tables(t);

    expect(second.trades).toHaveLength(2);
    expect(second.rubrics).toHaveLength(2);
    expect(second.trades.map((tr) => [tr._id, tr.activeRubricId])).toEqual(
      first.trades.map((tr) => [tr._id, tr.activeRubricId]),
    );
  });
});

describe("seed.expert (dev only, spec #36 decision 5)", () => {
  async function experts(t: ReturnType<typeof setup>) {
    return t.run((ctx) => ctx.db.query("experts").take(100));
  }

  it("makes the User with that email an active Expert for Electrical", async () => {
    const t = setup();
    const userId = await t.withIdentity(ANYANGO).mutation(api.users.store, {});
    await t.mutation(internal.seed.expert, { email: "  Anyango@Example.com " });

    expect(await experts(t)).toMatchObject([{ userId, approvedTrades: ["electrical"], active: true }]);
    const me = await t.withIdentity(ANYANGO).query(api.users.me, {});
    expect(me.roles.expert).toBe(true);
  });

  it("is idempotent, and reactivates an inactive row without dropping its Trades", async () => {
    const t = setup();
    const userId = await t.withIdentity(ANYANGO).mutation(api.users.store, {});
    await t.run((ctx) =>
      ctx.db.insert("experts", { userId, approvedTrades: ["hairdressing"], active: false }),
    );
    await t.mutation(internal.seed.expert, { email: ANYANGO.email });
    await t.mutation(internal.seed.expert, { email: ANYANGO.email });

    const rows = await experts(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].active).toBe(true);
    expect([...rows[0].approvedTrades].sort()).toEqual(["electrical", "hairdressing"]);
  });

  it("refuses an email with no users row, and writes nothing", async () => {
    const t = setup();
    await expect(
      t.mutation(internal.seed.expert, { email: "nobody@example.com" }),
    ).rejects.toThrowError(/users\.store|no user/i);
    expect(await experts(t)).toHaveLength(0);
  });
});
