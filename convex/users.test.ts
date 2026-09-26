import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { getRoles, requireUser } from "./lib/auth";
import schema from "./schema";
import { modules } from "./test.setup";

const WANJIRU = {
  tokenIdentifier: "https://clerk.example|user_wanjiru",
  subject: "user_wanjiru",
  issuer: "https://clerk.example",
  email: "wanjiru@example.com",
  emailVerified: true,
  name: "Wanjiru Kamau",
};

const OTIENO = {
  tokenIdentifier: "https://clerk.example|user_otieno",
  subject: "user_otieno",
  issuer: "https://clerk.example",
  email: "otieno@example.com",
  emailVerified: true,
  name: "Otieno Ochieng",
};

function setup() {
  return convexTest(schema, modules);
}

async function allUsers(t: ReturnType<typeof setup>) {
  return t.run((ctx) => ctx.db.query("users").take(100));
}

describe("users.store", () => {
  it("creates the caller's row from the token identity", async () => {
    const t = setup();
    const id = await t.withIdentity(WANJIRU).mutation(api.users.store, {});

    const rows = await allUsers(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: id,
      clerkId: WANJIRU.tokenIdentifier,
      email: WANJIRU.email,
      name: WANJIRU.name,
    });
  });

  it("updates the same row on a later sign-in instead of duplicating it", async () => {
    const t = setup();
    const first = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const second = await t
      .withIdentity({ ...WANJIRU, email: "wanjiru@new.example", name: "Wanjiru K." })
      .mutation(api.users.store, {});

    expect(second).toEqual(first);
    const rows = await allUsers(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "wanjiru@new.example", name: "Wanjiru K." });
  });

  it("keeps the fields it does not own (phone, county, isDemo)", async () => {
    const t = setup();
    const id = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await t.run((ctx) =>
      ctx.db.patch("users", id, { phone: "+254700000000", county: "Nairobi", isDemo: true }),
    );

    await t.withIdentity(WANJIRU).mutation(api.users.store, {});

    const row = await t.run((ctx) => ctx.db.get("users", id));
    expect(row).toMatchObject({ phone: "+254700000000", county: "Nairobi", isDemo: true });
  });

  it("stores the email trimmed and lowercased", async () => {
    const t = setup();
    await t.withIdentity({ ...WANJIRU, email: "  Wanjiru@Example.COM " }).mutation(api.users.store, {});
    const rows = await allUsers(t);
    expect(rows[0].email).toBe("wanjiru@example.com");
  });

  it("gives the same subject from a different issuer its own row", async () => {
    const t = setup();
    const clerkId = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const otherIssuer = {
      ...WANJIRU,
      issuer: "https://other-issuer.example",
      tokenIdentifier: "https://other-issuer.example|user_wanjiru",
    };
    const otherId = await t.withIdentity(otherIssuer).mutation(api.users.store, {});

    expect(otherId).not.toEqual(clerkId);
    const rows = await allUsers(t);
    expect(rows.map((r) => r.clerkId).sort()).toEqual(
      [otherIssuer.tokenIdentifier, WANJIRU.tokenIdentifier].sort(),
    );
  });

  it("rejects an unauthenticated caller and writes nothing", async () => {
    const t = setup();
    await expect(t.mutation(api.users.store, {})).rejects.toThrowError(/not authenticated/i);
    expect(await allUsers(t)).toHaveLength(0);
  });

  it("rejects a token without an email claim and writes nothing", async () => {
    const t = setup();
    const { email: _email, ...noEmail } = WANJIRU;
    await expect(t.withIdentity(noEmail).mutation(api.users.store, {})).rejects.toThrowError(
      /email/i,
    );
    expect(await allUsers(t)).toHaveLength(0);
  });

  it("takes no arguments, so a caller cannot choose whose row to write", async () => {
    const t = setup();
    await expect(
      t.withIdentity(WANJIRU).mutation(api.users.store, {
        clerkId: OTIENO.tokenIdentifier,
      } as never),
    ).rejects.toThrowError();
    expect(await allUsers(t)).toHaveLength(0);
  });
});

describe("users.me", () => {
  it("returns { user: null, roles } for a signed-in caller before store has run", async () => {
    const t = setup();
    expect(await t.withIdentity(WANJIRU).query(api.users.me, {})).toEqual({
      user: null,
      roles: { base: "none", expert: false, admin: false },
    });
  });

  it("returns { user, roles } with the caller's row after store", async () => {
    const t = setup();
    const id = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const me = await t.withIdentity(WANJIRU).query(api.users.me, {});
    expect(Object.keys(me ?? {}).sort()).toEqual(["roles", "user"]);
    expect(me?.user).toMatchObject({ _id: id, email: WANJIRU.email, name: WANJIRU.name });
    expect(me?.roles).toEqual({ base: "none", expert: false, admin: false });
  });

  it("never returns another user's row", async () => {
    const t = setup();
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});

    // Otieno has no row yet, so he gets null rather than someone else's row.
    expect((await t.withIdentity(OTIENO).query(api.users.me, {}))?.user).toBeNull();

    const otienoId = await t.withIdentity(OTIENO).mutation(api.users.store, {});
    const me = await t.withIdentity(OTIENO).query(api.users.me, {});
    expect(me?.user?._id).toEqual(otienoId);
    expect(me?.user?.email).toBe(OTIENO.email);
  });

  it("does not accept a user id argument", async () => {
    const t = setup();
    const wanjiruId = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    await expect(
      t.withIdentity(OTIENO).query(api.users.me, { userId: wanjiruId } as never),
    ).rejects.toThrowError();
  });

  it("returns null for a signed-out caller instead of throwing", async () => {
    const t = setup();
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    expect(await t.query(api.users.me, {})).toBeNull();
  });
});

describe("requireUser", () => {
  it("rejects an unauthenticated caller", async () => {
    const t = setup();
    await expect(t.run((ctx) => requireUser(ctx))).rejects.toThrowError(/not authenticated/i);
  });

  it("returns the identity and a null row before store", async () => {
    const t = setup();
    const result = await t.withIdentity(WANJIRU).run((ctx) => requireUser(ctx));
    expect(result.identity.tokenIdentifier).toBe(WANJIRU.tokenIdentifier);
    expect(result.user).toBeNull();
  });

  it("returns the caller's row after store", async () => {
    const t = setup();
    const id = await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const result = await t.withIdentity(WANJIRU).run((ctx) => requireUser(ctx));
    expect(result.user?._id).toEqual(id);
  });
});

describe("getRoles (ADR-18)", () => {
  const saved = process.env.ADMIN_EMAILS;
  beforeEach(() => {
    process.env.ADMIN_EMAILS = " Admin@Example.com , ops@example.com";
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = saved;
  });

  it("gives a fresh User Fundi `none`, no Expert role and no Admin role", async () => {
    const t = setup();
    await t.withIdentity(WANJIRU).mutation(api.users.store, {});
    const roles = await t.withIdentity(WANJIRU).run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    expect(roles).toEqual({ base: "none", expert: false, admin: false });
  });

  it("makes a verified email on ADMIN_EMAILS an Admin, ignoring case and spaces", async () => {
    const t = setup();
    const roles = await t
      .withIdentity({ ...WANJIRU, email: "admin@example.com" })
      .run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    expect(roles.admin).toBe(true);
  });

  it("refuses Admin when email_verified is false or missing", async () => {
    const t = setup();
    const unverified = await t
      .withIdentity({ ...WANJIRU, email: "admin@example.com", emailVerified: false })
      .run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    const { emailVerified: _verified, ...noClaim } = WANJIRU;
    const missing = await t
      .withIdentity({ ...noClaim, email: "admin@example.com" })
      .run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    expect(unverified.admin).toBe(false);
    expect(missing.admin).toBe(false);
  });

  it("keeps a verified email that is not on ADMIN_EMAILS non-Admin", async () => {
    const t = setup();
    const roles = await t.withIdentity(WANJIRU).run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    expect(roles.admin).toBe(false);
  });

  it("matches a mixed-case, spaced ADMIN_EMAILS entry against a token email in another case", async () => {
    process.env.ADMIN_EMAILS = "ops@example.com,  MiXeD.Admin@Example.COM  ";
    const t = setup();
    const roles = await t
      .withIdentity({ ...WANJIRU, email: "mixed.ADMIN@example.com" })
      .run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    expect(roles.admin).toBe(true);
  });

  it("shows Admin through users.me for a verified email on ADMIN_EMAILS", async () => {
    const t = setup();
    const me = await t.withIdentity({ ...WANJIRU, email: "admin@example.com" }).query(api.users.me, {});
    expect(me?.roles.admin).toBe(true);
  });

  it("refuses Admin when ADMIN_EMAILS is unset", async () => {
    delete process.env.ADMIN_EMAILS;
    const t = setup();
    const roles = await t
      .withIdentity({ ...WANJIRU, email: "admin@example.com" })
      .run(async (ctx) => getRoles(ctx, await requireUser(ctx)));
    expect(roles.admin).toBe(false);
  });
});
