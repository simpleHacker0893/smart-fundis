import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { canonicalCounty, KENYAN_COUNTIES } from "./lib/counties";
import { TRADE_SLUGS } from "./lib/tradeCatalogue";
import { TRADE_CATALOGUE } from "./lib/trades";
import { modules } from "./test.setup";

// The minimal onboarding form (#37, spec #36 decision 2; US-2.3 minimal, US-2.7).

const WANJIRU = {
  tokenIdentifier: "https://clerk.example|user_wanjiru",
  subject: "user_wanjiru",
  issuer: "https://clerk.example",
  email: "wanjiru@example.com",
  emailVerified: true,
  name: "Wanjiru Kamau",
};

const VALID = {
  name: "  Wanjiru   Kamau ",
  phone: "0712 345 678",
  tradeSlugs: ["electrical"],
  county: " nairobi ",
};

let t: ReturnType<typeof convexTest>;

beforeEach(async () => {
  t = convexTest(schema, modules);
  await t.mutation(internal.seed.trades, {});
});

async function profiles() {
  return t.run((ctx) => ctx.db.query("fundiProfiles").take(100));
}

/** The `data` of the ConvexError a call throws. */
async function errorData(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof ConvexError) return e.data;
    throw e;
  }
  throw new Error("expected the call to throw");
}

describe("fundiProfiles.create", () => {
  it("creates the profile, updates the users row, and makes the User a Fundi", async () => {
    const userId = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const profileId = await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, VALID);

    expect(await profiles()).toMatchObject([
      { _id: profileId, userId, trades: ["electrical"], county: "Nairobi", publicListing: true },
    ]);
    const me = await t.withIdentity(WANJIRU).query(api.users.me, {});
    expect(me?.user).toMatchObject({ name: "Wanjiru Kamau", phone: "+254712345678", county: "Nairobi" });
    expect(me?.roles.base).toBe("fundi");
  });

  it("keeps the name the Fundi typed when users.store runs on a later sign-in", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, name: "Mama Wanjiru" });
    await t
      .withIdentity({ ...WANJIRU, name: "W. Kamau", email: "wanjiru@new.example" })
      .mutation(api.users.store, {});

    const me = await t.withIdentity(WANJIRU).query(api.users.me, {});
    expect(me?.user).toMatchObject({ name: "Mama Wanjiru", email: "wanjiru@new.example" });
  });

  it("rejects an unauthenticated caller and writes nothing", async () => {
    await expect(t.mutation(api.fundiProfiles.create, VALID)).rejects.toThrowError(
      /not authenticated/i,
    );
    expect(await profiles()).toHaveLength(0);
  });

  it("rejects a signed-in caller whose users row does not exist yet", async () => {
    const data = await errorData(t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, VALID));
    expect(data).toMatchObject({ code: "no_user" });
    expect(await profiles()).toHaveLength(0);
  });

  it("rejects a second profile for the same User", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, VALID);
    const data = await errorData(
      t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, tradeSlugs: ["hairdressing"] }),
    );
    expect(data).toMatchObject({ code: "already_exists" });
    expect(await profiles()).toMatchObject([{ trades: ["electrical"] }]);
  });

  it("accepts several Trades, including ones that cannot be verified yet, trimmed and de-duplicated", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, {
      ...VALID,
      tradeSlugs: [" plumbing", "electrical", "plumbing ", "mamaFua", "electrical"],
    });
    expect(await profiles()).toMatchObject([{ trades: ["plumbing", "electrical", "mamaFua"] }]);
  });

  it("accepts several of the new catalogue Trades", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, {
      ...VALID,
      tradeSlugs: ["bicycleRepair", "tiling", "pestControl", "driving", "phoneRepair"],
    });
    expect(await profiles()).toMatchObject([
      { trades: ["bicycleRepair", "tiling", "pestControl", "driving", "phoneRepair"] },
    ]);
  });

  it("accepts all 62 Trades", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const all = (await t.withIdentity(WANJIRU).query(api.trades.list, {})).map((tr) => tr.slug);
    await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, tradeSlugs: all });
    expect((await profiles())[0].trades).toHaveLength(62);
  });

  it.each([
    ["no Trade", { tradeSlugs: [] }, { tradeSlugs: "required" }],
    ["only blank Trades", { tradeSlugs: ["  "] }, { tradeSlugs: "required" }],
    ["an unknown Trade", { tradeSlugs: ["electrical", "boat-building"] }, { tradeSlugs: "unknown" }],
    ["more distinct Trades than the catalogue has", { tradeSlugs: Array.from({ length: TRADE_SLUGS.length + 1 }, (_, i) => `t${i}`) }, { tradeSlugs: "unknown" }],
    ["more than rawMax (200) raw Trade entries", { tradeSlugs: Array.from({ length: 201 }, () => "electrical") }, { tradeSlugs: "unknown" }],
    ["a Trade slug longer than rawMax (200) characters", { tradeSlugs: ["electrical", "e".repeat(201)] }, { tradeSlugs: "unknown" }],
    ["a county that is not one of the 47", { county: "Atlantis" }, { county: "unknown" }],
    ["a phone that is not a Kenyan mobile", { phone: "12345" }, { phone: "invalid" }],
    ["a blank name", { name: "   " }, { name: "required" }],
    ["a name over 80 characters", { name: "a".repeat(81) }, { name: "tooLong" }],
  ])("rejects %s with a field error and writes nothing", async (_label, override, fields) => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const data = await errorData(
      t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, ...override }),
    );
    expect(data).toEqual({ code: "invalid", fields });
    expect(await profiles()).toHaveLength(0);
    const me = await t.withIdentity(WANJIRU).query(api.users.me, {});
    expect(me?.user?.phone).toBeUndefined();
    expect(me?.roles.base).toBe("none");
  });

  it("reports an unknown Trade together with the other field errors", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const data = await errorData(
      t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, name: "", tradeSlugs: ["boats"] }),
    );
    expect(data).toEqual({ code: "invalid", fields: { name: "required", tradeSlugs: "unknown" } });
  });

  it("does not accept a userId argument", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await expect(
      t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, userId: "x" } as never),
    ).rejects.toThrowError();
    expect(await profiles()).toHaveLength(0);
  });
});

describe("trades.list", () => {
  it("lists all 62 Trades in catalogue order, and only Electrical and Hairdressing can be verified now", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const trades = await t.withIdentity(WANJIRU).query(api.trades.list, {});
    expect(trades).toEqual(
      TRADE_CATALOGUE.map((tr) => ({
        slug: tr.slug,
        name: tr.name,
        category: tr.category,
        verifyNow: tr.slug === "electrical" || tr.slug === "hairdressing",
      })),
    );
    expect(trades).toHaveLength(62);
    expect(trades.slice(0, 3)).toEqual([
      { slug: "electrical", name: "Electrical", category: "skilled", verifyNow: true },
      { slug: "hairdressing", name: "Hairdressing", category: "skilled", verifyNow: true },
      { slug: "plumbing", name: "Plumbing", category: "skilled", verifyNow: false },
    ]);
    expect(trades[61]).toEqual({ slug: "bicycleRepair", name: "Bicycle repair", category: "semi_skilled", verifyNow: false });
  });

  it("lists a Trade that is not in the seed list after the seeded ones", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.run((ctx) => ctx.db.insert("trades", { slug: "aaa-boats", name: "Boats", category: "odd_job" }));
    const trades = await t.withIdentity(WANJIRU).query(api.trades.list, {});
    expect(trades).toHaveLength(63);
    expect(trades[62]).toEqual({ slug: "aaa-boats", name: "Boats", category: "odd_job", verifyNow: false });
  });

  it("rejects an unauthenticated caller", async () => {
    await expect(t.query(api.trades.list, {})).rejects.toThrowError(/not authenticated/i);
  });
});

describe("KENYAN_COUNTIES", () => {
  it("has the 47 counties, each once", () => {
    expect(KENYAN_COUNTIES).toHaveLength(47);
    expect(new Set(KENYAN_COUNTIES).size).toBe(47);
  });

  it.each([
    ["Nairobi County", "Nairobi"],
    ["  homa   bay ", "Homa Bay"],
    ["murang'a", "Murang'a"],
    ["Murang\u2019a", "Murang'a"],
    ["ELGEYO-MARAKWET", "Elgeyo-Marakwet"],
  ])("reads %j as %j", (raw, county) => {
    expect(canonicalCounty(raw)).toBe(county);
  });

  it("rejects anything else", () => {
    expect(canonicalCounty("Kampala")).toBeNull();
    expect(canonicalCounty("")).toBeNull();
  });
});

const KIPTOO = {
  tokenIdentifier: "https://clerk.example|user_kiptoo",
  subject: "user_kiptoo",
  issuer: "https://clerk.example",
  email: "kiptoo@example.com",
  emailVerified: true,
  name: "Kiptoo Rono",
};

describe("trades.uploadPicker", () => {
  it("lists only Verify-now Trades, each with its Task, Rubric checklist and client tick rule (US-3.2)", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t
      .withIdentity(WANJIRU)
      .mutation(api.fundiProfiles.create, { ...VALID, tradeSlugs: ["hairdressing", "plumbing"] });

    const picker = await t.withIdentity(WANJIRU).query(api.trades.uploadPicker, {});
    expect(picker.map((trade) => trade.slug)).toEqual(["electrical", "hairdressing"]);

    const [electrical, hairdressing] = picker;
    expect(electrical).toMatchObject({ name: "Electrical", onProfile: false });
    expect(hairdressing).toMatchObject({ name: "Hairdressing", onProfile: true });

    const socket = TRADE_CATALOGUE.find((trade) => trade.slug === "electrical")?.task;
    expect(electrical.tasks).toEqual([
      {
        slug: "13a-socket",
        name: "Install a 13A socket",
        rubricVersion: 1,
        needsClientConsent: false,
        items: socket?.items,
      },
    ]);
    expect(hairdressing.tasks).toMatchObject([{ slug: "cornrows", needsClientConsent: true }]);
    expect(hairdressing.tasks[0].items.map((item) => item.id)).toEqual([
      "prep",
      "tool_hygiene",
      "parting",
      "tension",
      "even_braids",
      "neat_ends",
    ]);
  });

  it("refuses a signed-out caller and a User who is not a Fundi", async () => {
    await expect(t.query(api.trades.uploadPicker, {})).rejects.toThrowError(/not authenticated/i);
    await t.withIdentity(KIPTOO).mutation(api.users.store, {});
    await expect(t.withIdentity(KIPTOO).query(api.trades.uploadPicker, {})).rejects.toThrowError(
      /fundi profile is required/i,
    );
  });
});

// Showcase links (#38, US-3.8, ADR-7): one YouTube and one TikTok link on the
// caller's own profile. Stored as the canonical link; never downloaded.
describe("fundiProfiles.setShowcaseLinks and myShowcaseLinks", () => {
  const YOUTUBE = "https://www.youtube.com/watch?v=2tdN85reWN0";
  const TIKTOK = "https://www.tiktok.com/@fundi.wanjiru/video/7212345678901234567";
  const OTIENO = {
    tokenIdentifier: "https://clerk.example|user_otieno",
    subject: "user_otieno",
    issuer: "https://clerk.example",
    email: "otieno@example.com",
    emailVerified: true,
    name: "Otieno Ouma",
  };

  async function asFundi(identity: typeof WANJIRU = WANJIRU) {
    await t.withIdentity(identity).mutation(api.users.store, {});
    await t.withIdentity(identity).mutation(api.fundiProfiles.create, VALID);
    return t.withIdentity(identity);
  }

  async function storedLinks(identity: typeof WANJIRU = WANJIRU) {
    return t.run(async (ctx) => {
      // Test tables hold a handful of rows, so a scan is fine here.
      const user = (await ctx.db.query("users").take(100)).find((u) => u.clerkId === identity.tokenIdentifier);
      const profile = (await ctx.db.query("fundiProfiles").take(100)).find((p) => p.userId === user!._id);
      // null, not undefined: t.run returns values through Convex serialisation.
      return profile!.links ?? null;
    });
  }

  it("saves both links as canonical links and reads them back with embeds", async () => {
    const fundi = await asFundi();
    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, {
      youtube: "  https://youtu.be/2tdN85reWN0?si=share ",
      tiktok: "tiktok.com/@fundi.wanjiru/video/7212345678901234567?lang=en",
    });

    expect(await storedLinks()).toEqual({ youtube: YOUTUBE, tiktok: TIKTOK });
    expect(await fundi.query(api.fundiProfiles.myShowcaseLinks, {})).toEqual({
      youtube: { id: "2tdN85reWN0", url: YOUTUBE, embedUrl: "https://www.youtube-nocookie.com/embed/2tdN85reWN0" },
      tiktok: {
        id: "7212345678901234567",
        url: TIKTOK,
        embedUrl: "https://www.tiktok.com/player/v1/7212345678901234567",
      },
    });
  });

  it("reads null for both when the Fundi has saved none", async () => {
    const fundi = await asFundi();
    expect(await fundi.query(api.fundiProfiles.myShowcaseLinks, {})).toEqual({ youtube: null, tiktok: null });
  });

  it("leaves an omitted slot unchanged, and clears a slot on null or blank", async () => {
    const fundi = await asFundi();
    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE, tiktok: TIKTOK });

    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, { tiktok: null });
    expect(await storedLinks()).toEqual({ youtube: YOUTUBE });

    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: "   " });
    expect(await storedLinks()).toBeNull();
    expect(await fundi.query(api.fundiProfiles.myShowcaseLinks, {})).toEqual({ youtube: null, tiktok: null });
  });

  it("keeps the other link fields when it writes", async () => {
    const fundi = await asFundi();
    await t.run(async (ctx) => {
      const profile = await ctx.db.query("fundiProfiles").first();
      await ctx.db.patch("fundiProfiles", profile!._id, { links: { linkedin: "https://www.linkedin.com/in/x" } });
    });
    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE });
    expect(await storedLinks()).toEqual({ linkedin: "https://www.linkedin.com/in/x", youtube: YOUTUBE });
  });

  it("rejects a wrong-site, malformed or short TikTok link and saves nothing", async () => {
    const fundi = await asFundi();
    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE });

    expect(
      await errorData(fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: TIKTOK, tiktok: YOUTUBE })),
    ).toEqual({ code: "invalid", fields: { youtube: "wrong_site", tiktok: "wrong_site" } });
    expect(
      await errorData(
        fundi.mutation(api.fundiProfiles.setShowcaseLinks, {
          youtube: "https://www.youtube.com/watch?v=short",
          tiktok: "https://vm.tiktok.com/ZMabc123/",
        }),
      ),
    ).toEqual({ code: "invalid", fields: { youtube: "unsupported", tiktok: "tiktok_short" } });
    // One bad slot fails the whole call: the good TikTok link is not saved either.
    expect(
      await errorData(
        fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: "javascript:alert(1)", tiktok: TIKTOK }),
      ),
    ).toEqual({ code: "invalid", fields: { youtube: "unsupported" } });

    expect(await storedLinks()).toEqual({ youtube: YOUTUBE });
  });

  it("rejects an oversize link as unsupported and saves nothing", async () => {
    const fundi = await asFundi();
    await fundi.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE });
    expect(
      await errorData(
        fundi.mutation(api.fundiProfiles.setShowcaseLinks, {
          youtube: "https://youtu.be/" + "a".repeat(100_000),
          tiktok: TIKTOK,
        }),
      ),
    ).toEqual({ code: "invalid", fields: { youtube: "unsupported" } });
    expect(await storedLinks()).toEqual({ youtube: YOUTUBE });
  });

  it("rejects a signed-out caller", async () => {
    await expect(t.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE })).rejects.toThrowError(
      /not authenticated/i,
    );
    await expect(t.query(api.fundiProfiles.myShowcaseLinks, {})).rejects.toThrowError(/not authenticated/i);
  });

  it("rejects a signed-in User who is not a Fundi and writes nothing", async () => {
    await t.withIdentity(OTIENO).mutation(api.users.store, {});
    expect(
      await errorData(t.withIdentity(OTIENO).mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE })),
    ).toMatchObject({ code: "forbidden" });
    expect(await errorData(t.withIdentity(OTIENO).query(api.fundiProfiles.myShowcaseLinks, {}))).toMatchObject({
      code: "forbidden",
    });
    expect(await profiles()).toHaveLength(0);
  });

  it("acts only on the caller's own profile", async () => {
    const wanjiru = await asFundi();
    const otieno = await asFundi(OTIENO);
    await wanjiru.mutation(api.fundiProfiles.setShowcaseLinks, { youtube: YOUTUBE });
    await otieno.mutation(api.fundiProfiles.setShowcaseLinks, { tiktok: TIKTOK });

    expect(await storedLinks(WANJIRU)).toEqual({ youtube: YOUTUBE });
    expect(await storedLinks(OTIENO)).toEqual({ tiktok: TIKTOK });
    expect(await otieno.query(api.fundiProfiles.myShowcaseLinks, {})).toMatchObject({ youtube: null });
  });
});
