import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { canonicalCounty, KENYAN_COUNTIES } from "./lib/counties";
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

  it("accepts all 12 Trades", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const all = (await t.withIdentity(WANJIRU).query(api.trades.list, {})).map((tr) => tr.slug);
    await t.withIdentity(WANJIRU).mutation(api.fundiProfiles.create, { ...VALID, tradeSlugs: all });
    expect((await profiles())[0].trades).toHaveLength(12);
  });

  it.each([
    ["no Trade", { tradeSlugs: [] }, { tradeSlugs: "required" }],
    ["only blank Trades", { tradeSlugs: ["  "] }, { tradeSlugs: "required" }],
    ["an unknown Trade", { tradeSlugs: ["electrical", "boat-building"] }, { tradeSlugs: "unknown" }],
    ["more than 12 distinct Trades", { tradeSlugs: Array.from({ length: 13 }, (_, i) => `t${i}`) }, { tradeSlugs: "unknown" }],
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
  it("lists all 12 Trades in the web's order, and only Electrical and Hairdressing can be verified now", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const trades = await t.withIdentity(WANJIRU).query(api.trades.list, {});
    expect(trades).toEqual([
      { slug: "electrical", name: "Electrical", verifyNow: true },
      { slug: "hairdressing", name: "Hairdressing", verifyNow: true },
      { slug: "plumbing", name: "Plumbing", verifyNow: false },
      { slug: "masonry", name: "Masonry", verifyNow: false },
      { slug: "carpentry", name: "Carpentry", verifyNow: false },
      { slug: "welding", name: "Welding", verifyNow: false },
      { slug: "mechanic", name: "Mechanic", verifyNow: false },
      { slug: "tailoring", name: "Tailoring", verifyNow: false },
      { slug: "beauty", name: "Beauty", verifyNow: false },
      { slug: "solar", name: "Solar installation", verifyNow: false },
      { slug: "mamaFua", name: "Mama fua (laundry)", verifyNow: false },
      { slug: "movers", name: "Movers", verifyNow: false },
    ]);
  });

  it("lists a Trade that is not in the seed list after the seeded ones", async () => {
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.run((ctx) => ctx.db.insert("trades", { slug: "aaa-boats", name: "Boats", category: "odd_job" }));
    const trades = await t.withIdentity(WANJIRU).query(api.trades.list, {});
    expect(trades).toHaveLength(13);
    expect(trades[12]).toEqual({ slug: "aaa-boats", name: "Boats", verifyNow: false });
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
