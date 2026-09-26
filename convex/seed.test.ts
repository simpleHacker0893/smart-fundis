import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import * as tradeCatalogue from "./lib/tradeCatalogue";
import { TRADE_LICENCE, TRADE_SLUGS } from "./lib/tradeCatalogue";
import { TRADE_CATALOGUE, TRADE_TASKS } from "./lib/trades";
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

/** The 62 Trades of the approved catalogue (docs/research/2026-09-26-kenya-trades-catalogue.md), in row order. */
const CATALOGUE_SLUGS = [
  "electrical", "hairdressing", "plumbing", "masonry", "carpentry", "welding", "mechanic", "tailoring",
  "beauty", "solar", "mamaFua", "movers", "painting", "tiling", "roofing", "steelFixing", "glazing",
  "gypsum", "constructionHelper", "paving", "signWriting", "furnitureMaking", "upholstery", "woodCarving",
  "interiorDecor", "landscaping", "cleaning", "cooking", "baking", "shoeRepair", "leatherwork",
  "motorcycleRepair", "autoElectrical", "panelBeating", "sprayPainting", "tyreRepair", "carWash",
  "refrigerationAc", "phoneRepair", "electronicsRepair", "computerRepair", "cctvSecurity", "satelliteTv",
  "pumpRepair", "motorRewinding", "generatorRepair", "pestControl", "barbering", "nails", "makeup",
  "knitting", "weaving", "beadwork", "metalwork", "textileDecoration", "printing", "photography",
  "eventDecor", "driving", "locksmith", "farmHand", "bicycleRepair",
];

/** Spot checks of English name and category against the catalogue table. */
const SPOT_CHECKS = [
  ["electrical", "Electrical", "skilled"],
  ["tailoring", "Tailoring", "skilled"],
  ["beauty", "Beauty", "skilled"],
  ["mamaFua", "Mama fua (laundry)", "odd_job"],
  ["painting", "Painting & decorating", "skilled"],
  ["paving", "Cabro & paving", "semi_skilled"],
  ["constructionHelper", "Site helper (mjengo)", "odd_job"],
  ["motorcycleRepair", "Motorcycle (boda) repair", "skilled"],
  ["textileDecoration", "Embroidery, batik & tie-dye", "skilled"],
  ["driving", "Driver", "semi_skilled"],
  ["bicycleRepair", "Bicycle repair", "semi_skilled"],
] as const;
const VERIFY_NOW = ["electrical", "hairdressing"];

describe("seed.trades (US-3.2, operator change on #37)", () => {
  it("creates all 62 catalogue Trades with the catalogue's names and categories", async () => {
    const t = setup();
    const seeded = await t.mutation(internal.seed.trades, {});
    expect(seeded.map((s) => s.slug)).toEqual(CATALOGUE_SLUGS);
    const { trades } = await tables(t);
    const bySlug = Object.fromEntries(trades.map((tr) => [tr.slug, tr]));
    expect(trades).toHaveLength(62);
    for (const seed of TRADE_CATALOGUE) {
      expect(bySlug[seed.slug], seed.slug).toMatchObject({ name: seed.name, category: seed.category });
    }
    for (const [slug, name, category] of SPOT_CHECKS) {
      expect(bySlug[slug], slug).toMatchObject({ name, category });
    }
  });

  it("moves an existing Trade to its new catalogue category (tailoring was semi_skilled)", async () => {
    const t = setup();
    await t.run((ctx) => ctx.db.insert("trades", { slug: "tailoring", name: "Tailoring", category: "semi_skilled" }));
    await t.mutation(internal.seed.trades, {});
    const { trades } = await tables(t);
    expect(trades.filter((tr) => tr.slug === "tailoring")).toMatchObject([{ category: "skilled" }]);
  });

  it("gives only Electrical and Hairdressing a Rubric; the other 60 have no activeRubricId", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});
    const { trades, rubrics } = await tables(t);
    expect(rubrics.map((r) => r.tradeSlug).sort()).toEqual(VERIFY_NOW);
    const withRubric = trades.filter((tr) => tr.activeRubricId !== undefined).map((tr) => tr.slug);
    expect(withRubric.sort()).toEqual(VERIFY_NOW);
  });

  it("gives Electrical and Hairdressing an active v1 Rubric", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});

    const { trades, rubrics } = await tables(t);
    expect(rubrics).toHaveLength(2);

    for (const trade of trades.filter((tr) => VERIFY_NOW.includes(tr.slug))) {
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
    expect(hair).toMatchObject({ taskSlug: "cornrows", taskName: "Cornrows" });
  });

  it("marks the rai-reviewed Electrical items `terminals` and `no_bare_copper` as safety items", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});
    const { rubrics } = await tables(t);
    const items = rubrics.find((r) => r.tradeSlug === "electrical")?.items ?? [];
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId.terminals).toMatchObject({ safety: true, text: expect.stringMatching(/to the camera/) });
    expect(byId.no_bare_copper).toMatchObject({ safety: true, text: expect.stringMatching(/light pull/) });
    expect(items.filter((i) => i.safety).map((i) => i.id)).toEqual([
      "isolate",
      "test_dead",
      "terminals",
      "earth",
      "no_bare_copper",
    ]);
  });

  it("is idempotent: a second run leaves 62 Trades and 2 Rubrics, with the same ids", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});
    const first = await tables(t);
    await t.mutation(internal.seed.trades, {});
    const second = await tables(t);

    expect(second.trades).toHaveLength(62);
    expect(second.rubrics).toHaveLength(2);
    expect(second.trades.map((tr) => [tr._id, tr.activeRubricId])).toEqual(
      first.trades.map((tr) => [tr._id, tr.activeRubricId]),
    );
  });
});

describe("the Trade catalogue (lib/trades)", () => {
  it("exports TRADE_SLUGS in catalogue row order, each once", () => {
    expect(TRADE_SLUGS).toEqual(CATALOGUE_SLUGS);
    expect(new Set(TRADE_SLUGS).size).toBe(62);
  });

  it("keeps a Task only on Electrical and Hairdressing", () => {
    expect(TRADE_CATALOGUE.filter((tr) => tr.task !== undefined).map((tr) => tr.slug)).toEqual(VERIFY_NOW);
  });

  it("tags the Trades the catalogue says need a licence", () => {
    expect(TRADE_LICENCE).toEqual({
      electrical: "EPRA",
      plumbing: "NCA",
      masonry: "NCA",
      carpentry: "NCA",
      solar: "EPRA",
      painting: "NCA",
      tiling: "NCA",
      roofing: "NCA",
      steelFixing: "NCA",
      glazing: "NCA",
      gypsum: "NCA",
      paving: "NCA",
      pestControl: "PCPB",
      driving: "NTSA",
    });
  });
});

describe("seed.trades on a deployment that already has v1 (review C4)", () => {
  const STALE = [{ id: "terminals", text: "old text", safety: false }];

  async function insertStaleV1(t: ReturnType<typeof setup>) {
    return t.run(async (ctx) => {
      const rubricId = await ctx.db.insert("rubrics", {
        tradeSlug: "electrical",
        taskSlug: "13a-socket",
        taskName: "Install a 13A socket",
        version: 1,
        items: STALE,
        status: "active",
      });
      await ctx.db.insert("trades", {
        slug: "electrical",
        name: "Electrical",
        category: "skilled",
        activeRubricId: rubricId,
      });
      return rubricId;
    });
  }

  async function insertAssessment(t: ReturnType<typeof setup>, rubricId: Id<"rubrics">) {
    const userId = await t.withIdentity(ANYANGO).mutation(api.users.store, {});
    await t.run((ctx) =>
      ctx.db.insert("assessments", {
        fundiUserId: userId,
        tradeSlug: "electrical",
        rubricId,
        consentVersion: "v1",
        consentAt: 0,
        livenessCode: "4821",
        status: "queued",
        attempts: 0,
        licenseStatus: "none",
      }),
    );
  }

  it("rewrites a stale v1 in place (same id) when no Assessment references it", async () => {
    const t = setup();
    const rubricId = await insertStaleV1(t);
    await t.mutation(internal.seed.trades, {});

    const rubric = await t.run((ctx) => ctx.db.get("rubrics", rubricId));
    expect(rubric?.items.find((i) => i.id === "terminals")?.safety).toBe(true);
    expect(rubric?.items.length).toBeGreaterThan(1);
    const { rubrics } = await tables(t);
    expect(rubrics.filter((r) => r.tradeSlug === "electrical")).toHaveLength(1);
  });

  it("also renames the Task in place (Cornrows / braiding -> Cornrows)", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});
    await t.run(async (ctx) => {
      const hair = (await ctx.db.query("rubrics").take(10)).find((r) => r.tradeSlug === "hairdressing");
      await ctx.db.patch("rubrics", hair!._id, { taskName: "Cornrows / braiding" });
    });
    await t.mutation(internal.seed.trades, {});
    const { rubrics } = await tables(t);
    expect(rubrics.find((r) => r.tradeSlug === "hairdressing")?.taskName).toBe("Cornrows");
  });

  it("throws, and changes nothing, when a stale v1 is referenced by an Assessment", async () => {
    const t = setup();
    const rubricId = await insertStaleV1(t);
    await insertAssessment(t, rubricId);

    await expect(t.mutation(internal.seed.trades, {})).rejects.toThrowError(/new version|referenced/i);
    const rubric = await t.run((ctx) => ctx.db.get("rubrics", rubricId));
    expect(rubric?.items).toEqual(STALE);
  });

  it("does not throw for a referenced Rubric whose content already matches", async () => {
    const t = setup();
    await t.mutation(internal.seed.trades, {});
    const { rubrics } = await tables(t);
    await insertAssessment(t, rubrics[0]._id);
    await expect(t.mutation(internal.seed.trades, {})).resolves.toHaveLength(62);
  });
});

describe("seed.expert (dev only, spec #36 decision 5)", () => {
  const saved = process.env.ALLOW_DEV_SEED;
  beforeEach(() => {
    process.env.ALLOW_DEV_SEED = "true";
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ALLOW_DEV_SEED;
    else process.env.ALLOW_DEV_SEED = saved;
  });


  async function experts(t: ReturnType<typeof setup>) {
    return t.run((ctx) => ctx.db.query("experts").take(100));
  }

  it("makes the User with that email an active Expert for Electrical", async () => {
    const t = setup();
    const userId = await t.withIdentity(ANYANGO).mutation(api.users.store, {});
    await t.mutation(internal.seed.expert, { email: "  Anyango@Example.com " });

    expect(await experts(t)).toMatchObject([{ userId, approvedTrades: ["electrical"], active: true }]);
    const me = await t.withIdentity(ANYANGO).query(api.users.me, {});
    expect(me?.roles.expert).toBe(true);
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

  it("is forbidden unless ALLOW_DEV_SEED is exactly \"true\", and writes nothing", async () => {
    const t = setup();
    await t.withIdentity(ANYANGO).mutation(api.users.store, {});
    for (const value of [undefined, "1", "TRUE", ""]) {
      if (value === undefined) delete process.env.ALLOW_DEV_SEED;
      else process.env.ALLOW_DEV_SEED = value;
      await expect(
        t.mutation(internal.seed.expert, { email: ANYANGO.email }),
      ).rejects.toThrowError(/forbidden/);
    }
    expect(await experts(t)).toHaveLength(0);
    expect(await t.run((ctx) => ctx.db.query("auditLog").take(10))).toHaveLength(0);
  });

  it("writes an auditLog row with the target User as actor", async () => {
    const t = setup();
    const userId = await t.withIdentity(ANYANGO).mutation(api.users.store, {});
    const expertId = await t.mutation(internal.seed.expert, { email: ANYANGO.email });

    const log = await t.run((ctx) => ctx.db.query("auditLog").take(10));
    expect(log).toMatchObject([
      {
        actorUserId: userId,
        action: "seed.expert",
        targetTable: "experts",
        targetId: expertId,
        reason: expect.stringMatching(/dev seed/i),
      },
    ]);
  });

  it("refuses an email with no users row, and writes nothing", async () => {
    const t = setup();
    await expect(
      t.mutation(internal.seed.expert, { email: "nobody@example.com" }),
    ).rejects.toThrowError(/users\.store|no user/i);
    expect(await experts(t)).toHaveLength(0);
  });
});

// The web bundles lib/tradeCatalogue.ts (TRADE_LICENCE) and lib/fundiProfile.ts
// (the form rules), so neither may carry a Task or any Rubric item text (#37).
describe("the Rubric-free catalogue (lib/tradeCatalogue)", () => {
  const sources = import.meta.glob<string>(["./lib/tradeCatalogue.ts", "./lib/fundiProfile.ts"], {
    query: "?raw",
    import: "default",
    eager: true,
  });
  const rubricTexts = Object.values(TRADE_TASKS).flatMap((task) => [
    task.slug,
    task.name,
    ...task.items.flatMap((item) => [item.id, item.text]),
  ]);

  it("exports no Task and no Rubric item text", () => {
    const exported = JSON.stringify(tradeCatalogue);
    expect(exported).not.toMatch(/"(task|items|text)":/);
    for (const text of rubricTexts) expect(exported, text).not.toContain(JSON.stringify(text));
    for (const row of tradeCatalogue.TRADE_ROWS) expect(Object.keys(row).sort()).toEqual(
      ["category", "name", "slug", ...(row.licence === undefined ? [] : ["licence"])].sort(),
    );
  });

  it("is what lib/fundiProfile.ts imports, never lib/trades.ts", () => {
    expect(Object.keys(sources)).toHaveLength(2);
    for (const [path, source] of Object.entries(sources)) {
      expect(source, path).not.toMatch(/from\s+["']\.\/trades["']/);
      for (const text of rubricTexts.filter((t) => t.length > 20)) expect(source, path).not.toContain(text);
    }
    expect(sources["./lib/fundiProfile.ts"]).toMatch(/from\s+["']\.\/tradeCatalogue["']/);
  });
});
