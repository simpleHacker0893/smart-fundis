/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import * as contactModule from "./contact";
import { normalizeContact, validateContact } from "./lib/contact";
import schema from "./schema";
import { modules } from "./test.setup";

// Source text of every Convex module (Vite `?raw`), to prove no read path exists.
const sources = import.meta.glob<string>(["./**/*.ts", "!./_generated/**", "!./**/*.test.ts", "!./test.setup.ts"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const VALID = {
  name: "Wanjiru Kamau",
  contact: "wanjiru@example.com",
  role: "fundi",
  topic: "My badge",
  message: "How long does a review take after I upload?",
};

function setup() {
  return convexTest(schema, modules);
}

async function stored(t: ReturnType<typeof setup>) {
  return t.run((ctx) => ctx.db.query("contactMessages").take(100));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-26T09:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("contact.send", () => {
  it("stores a valid message as `new` and returns only { ok: true }", async () => {
    const t = setup();
    const result = await t.mutation(api.contact.send, VALID);

    expect(result).toEqual({ ok: true });
    const rows = await stored(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ...VALID,
      status: "new",
      createdAt: Date.parse("2026-09-26T09:00:00Z"),
    });
  });

  it("trims fields and normalises the contact (email lowercased, phone to +254)", async () => {
    const t = setup();
    await t.mutation(api.contact.send, { ...VALID, name: "  Wanjiru  ", contact: " Wanjiru@Example.COM " });
    await t.mutation(api.contact.send, { ...VALID, contact: "0712 345 678" });
    const rows = await stored(t);
    expect(rows.map((r) => r.contact)).toEqual(["wanjiru@example.com", "+254712345678"]);
    expect(rows[0].name).toBe("Wanjiru");
  });

  it.each([
    ["an empty name", { name: "   " }],
    ["a name over 80 characters", { name: "a".repeat(81) }],
    ["an empty contact", { contact: "" }],
    ["a contact that is neither email nor Kenyan phone", { contact: "call me maybe" }],
    ["a non-Kenyan phone", { contact: "+447700900123" }],
    ["a short Kenyan phone", { contact: "07123" }],
    ["an email without a domain", { contact: "wanjiru@" }],
    ["an unknown role", { role: "admin" }],
    ["an empty topic", { topic: " " }],
    ["a topic over 120 characters", { topic: "t".repeat(121) }],
    ["a message under 10 characters", { message: "Too short" }],
    ["a message over 2000 characters", { message: "m".repeat(2001) }],
  ])("rejects %s with a generic error and stores nothing", async (_label, change) => {
    const t = setup();
    await expect(t.mutation(api.contact.send, { ...VALID, ...change })).rejects.toThrowError(
      /could not be sent/i,
    );
    expect(await stored(t)).toHaveLength(0);
  });

  it("accepts the message length limits exactly (10 and 2000)", async () => {
    const t = setup();
    await t.mutation(api.contact.send, { ...VALID, message: "m".repeat(10) });
    await t.mutation(api.contact.send, { ...VALID, contact: "0711111111", message: "m".repeat(2000) });
    expect(await stored(t)).toHaveLength(2);
  });

  it("accepts every role in the table", async () => {
    const t = setup();
    for (const [i, role] of ["client", "fundi", "expert", "other"].entries()) {
      await t.mutation(api.contact.send, { ...VALID, contact: `p${i}@example.com`, role });
    }
    expect((await stored(t)).map((r) => r.role)).toEqual(["client", "fundi", "expert", "other"]);
  });

  it("silently drops a message whose honeypot is filled, still answering { ok: true }", async () => {
    const t = setup();
    const result = await t.mutation(api.contact.send, { ...VALID, website: "http://spam.example" });
    expect(result).toEqual({ ok: true });
    expect(await stored(t)).toHaveLength(0);
  });

  it("drops a honeypot message even when the rest is invalid", async () => {
    const t = setup();
    await expect(
      t.mutation(api.contact.send, { ...VALID, message: "x", website: "bot" }),
    ).resolves.toEqual({ ok: true });
    expect(await stored(t)).toHaveLength(0);
  });

  it("rejects the 4th message from one contact within 10 minutes", async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.contact.send, VALID);
      vi.advanceTimersByTime(60_000);
    }
    await expect(t.mutation(api.contact.send, VALID)).rejects.toThrowError(/too many/i);
    expect(await stored(t)).toHaveLength(3);
  });

  it("counts a phone written different ways as the same contact", async () => {
    const t = setup();
    await t.mutation(api.contact.send, { ...VALID, contact: "0712345678" });
    await t.mutation(api.contact.send, { ...VALID, contact: "+254 712 345 678" });
    await t.mutation(api.contact.send, { ...VALID, contact: "254712345678" });
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "0712-345-678" }),
    ).rejects.toThrowError(/too many/i);
  });

  it("allows a 4th message once 10 minutes have passed since the first", async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) await t.mutation(api.contact.send, VALID);
    vi.advanceTimersByTime(10 * 60_000 + 1);
    await expect(t.mutation(api.contact.send, VALID)).resolves.toEqual({ ok: true });
  });

  it("throttles per contact, not globally", async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) await t.mutation(api.contact.send, VALID);
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "otieno@example.com" }),
    ).resolves.toEqual({ ok: true });
  });
});

describe("no read path for contact messages", () => {
  it("contact.ts exports only the send mutation", () => {
    expect(Object.keys(contactModule)).toEqual(["send"]);
    const send = contactModule.send as unknown as { isMutation?: boolean; isPublic?: boolean };
    expect(send.isMutation).toBe(true);
  });

  it("the only public query or action in the whole app is users.me", async () => {
    const readers: string[] = [];
    for (const [path, load] of Object.entries(modules)) {
      // Skip generated code, tests and config (auth.config.ts needs deployment env).
      if (path.includes("_generated") || /\.(test|setup|config)\.ts$/.test(path)) continue;
      const mod = (await load()) as Record<string, { isPublic?: boolean; isQuery?: boolean; isAction?: boolean }>;
      for (const [name, fn] of Object.entries(mod)) {
        if (fn?.isPublic && (fn.isQuery || fn.isAction)) readers.push(`${path}:${name}`);
      }
    }
    expect(readers).toEqual(["./users.ts:me"]);
  });

  it("no other Convex module touches contactMessages", () => {
    const touching = Object.entries(sources)
      .filter(([, text]) => text.includes("contactMessages"))
      .map(([path]) => path)
      .sort();
    expect(Object.keys(sources).length).toBeGreaterThan(3);
    expect(touching).toEqual(["./contact.ts", "./schema.ts"]);
  });
});

describe("validateContact (shared with the web form)", () => {
  it("returns no errors for a valid message", () => {
    expect(validateContact(VALID)).toEqual({});
  });

  it("names each failing field", () => {
    expect(
      validateContact({ name: "", contact: "nope", role: "x", topic: "", message: "short" }),
    ).toEqual({
      name: "required",
      contact: "invalid",
      role: "invalid",
      topic: "required",
      message: "tooShort",
    });
  });

  it.each([
    ["+254712345678", "+254712345678"],
    ["0712345678", "+254712345678"],
    ["254712345678", "+254712345678"],
    ["0110 123 456", "+254110123456"],
    ["Someone@Example.com", "someone@example.com"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalizeContact(input)).toBe(expected);
  });
});
