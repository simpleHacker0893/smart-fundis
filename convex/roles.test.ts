import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getRoles, requireExpert, requireFundi, requireUser } from "./lib/auth";
import schema from "./schema";
import { modules } from "./test.setup";

// Derived roles (ADR-18, spec §4, US-2.8): Fundi from a fundiProfiles row,
// Expert from an active experts row with approved Trades.

const WANJIRU = {
  tokenIdentifier: "https://clerk.example|user_wanjiru",
  subject: "user_wanjiru",
  issuer: "https://clerk.example",
  email: "wanjiru@example.com",
  emailVerified: true,
  name: "Wanjiru Kamau",
};

function setup() {
  return convexTest(schema, modules);
}

async function signedUpUser(t: ReturnType<typeof setup>): Promise<Id<"users">> {
  return t.withIdentity(WANJIRU).mutation(api.users.store, {});
}

async function rolesOf(t: ReturnType<typeof setup>) {
  return t.withIdentity(WANJIRU).run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
}

describe("getRoles: Fundi", () => {
  it("is `none` with no Fundi profile", async () => {
    const t = setup();
    await signedUpUser(t);
    expect((await rolesOf(t)).base).toBe("none");
  });

  it("is `none` before users.store has created the row", async () => {
    const t = setup();
    expect((await rolesOf(t)).base).toBe("none");
  });

  it("is `fundi` once a Fundi profile exists", async () => {
    const t = setup();
    const userId = await signedUpUser(t);
    await t.run((ctx) =>
      ctx.db.insert("fundiProfiles", {
        userId,
        trades: ["electrical"],
        county: "Nairobi",
        publicListing: true,
      }),
    );
    expect((await rolesOf(t)).base).toBe("fundi");
  });
});

describe("getRoles: Expert", () => {
  async function withExpertRow(approvedTrades: string[], active: boolean) {
    const t = setup();
    const userId = await signedUpUser(t);
    await t.run((ctx) => ctx.db.insert("experts", { userId, approvedTrades, active }));
    return t;
  }

  it("is false with no experts row", async () => {
    const t = setup();
    await signedUpUser(t);
    expect((await rolesOf(t)).expert).toBe(false);
  });

  it("is false for an inactive Expert", async () => {
    const t = await withExpertRow(["electrical"], false);
    expect((await rolesOf(t)).expert).toBe(false);
  });

  it("is false for an active Expert with no approved Trades", async () => {
    const t = await withExpertRow([], true);
    expect((await rolesOf(t)).expert).toBe(false);
  });

  it("is true for an active Expert with approved Trades", async () => {
    const t = await withExpertRow(["electrical"], true);
    expect((await rolesOf(t)).expert).toBe(true);
  });

  it("does not make an Expert a Fundi, or a Fundi an Expert", async () => {
    const t = await withExpertRow(["electrical"], true);
    expect(await rolesOf(t)).toEqual({ base: "none", expert: true, admin: false });
  });

  it("shows through users.me", async () => {
    const t = await withExpertRow(["electrical"], true);
    const me = await t.withIdentity(WANJIRU).query(api.users.me, {});
    expect(me.roles.expert).toBe(true);
  });
});

describe("requireFundi", () => {
  it("rejects an unauthenticated caller", async () => {
    const t = setup();
    await expect(t.run((ctx) => requireFundi(ctx))).rejects.toThrowError(/not authenticated/i);
  });

  it("rejects a signed-in User with no Fundi profile", async () => {
    const t = setup();
    await signedUpUser(t);
    await expect(t.withIdentity(WANJIRU).run((ctx) => requireFundi(ctx))).rejects.toThrowError(
      /fundi profile/i,
    );
  });

  it("returns the user and profile for a Fundi", async () => {
    const t = setup();
    const userId = await signedUpUser(t);
    const profileId = await t.run((ctx) =>
      ctx.db.insert("fundiProfiles", { userId, trades: ["electrical"], county: "Nairobi", publicListing: true }),
    );
    const fundi = await t.withIdentity(WANJIRU).run((ctx) => requireFundi(ctx));
    expect(fundi.user._id).toEqual(userId);
    expect(fundi.profile._id).toEqual(profileId);
  });
});

describe("requireExpert", () => {
  async function expertFor(approvedTrades: string[], active = true) {
    const t = setup();
    const userId = await signedUpUser(t);
    await t.run((ctx) => ctx.db.insert("experts", { userId, approvedTrades, active }));
    return t;
  }

  it("rejects an unauthenticated caller", async () => {
    const t = setup();
    await expect(t.run((ctx) => requireExpert(ctx))).rejects.toThrowError(/not authenticated/i);
  });

  it("rejects a User who is not an Expert", async () => {
    const t = setup();
    await signedUpUser(t);
    await expect(t.withIdentity(WANJIRU).run((ctx) => requireExpert(ctx))).rejects.toThrowError(
      /expert/i,
    );
  });

  it("rejects an inactive Expert", async () => {
    const t = await expertFor(["electrical"], false);
    await expect(t.withIdentity(WANJIRU).run((ctx) => requireExpert(ctx))).rejects.toThrowError(
      /expert/i,
    );
  });

  it("accepts an active Expert with no Trade asked for", async () => {
    const t = await expertFor(["electrical"]);
    const expert = await t.withIdentity(WANJIRU).run((ctx) => requireExpert(ctx));
    expect(expert.expert.approvedTrades).toEqual(["electrical"]);
  });

  it("accepts an Expert approved for the Trade asked for", async () => {
    const t = await expertFor(["electrical"]);
    await expect(
      t.withIdentity(WANJIRU).run((ctx) => requireExpert(ctx, "electrical")),
    ).resolves.toBeTruthy();
  });

  it("rejects an Expert not approved for the Trade asked for", async () => {
    const t = await expertFor(["electrical"]);
    await expect(
      t.withIdentity(WANJIRU).run((ctx) => requireExpert(ctx, "hairdressing")),
    ).rejects.toThrowError(/hairdressing/i);
  });
});
