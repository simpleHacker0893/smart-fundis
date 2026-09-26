/// <reference types="vite/client" />
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import * as contactModule from "./contact";
import {
  CONTACT_ROLES,
  cleanLine,
  cleanMessage,
  contactKey,
  contactRoleValidator,
  normalizeContact,
  validateContact,
} from "./lib/contact";
import schema from "./schema";
import { modules } from "./test.setup";

// Source text of every Convex module (Vite `?raw`), to prove no read path exists.
const sources = import.meta.glob<string>(
  ["./**/*.ts", "!./_generated/**", "!./**/*.test.ts", "!./test.setup.ts"],
  { query: "?raw", import: "default", eager: true },
);

const VALID = {
  name: "Wanjiru Kamau",
  contact: "wanjiru@example.com",
  role: "fundi" as const,
  topic: "My badge",
  message: "How long does a review take after I upload?",
};

// The one message for every server-side refusal: invalid input, the
// per-contact throttle and the global cap all look the same (no oracle).
const GENERIC = /could not be sent right now\. Try again later, or email info@smartfundis\.com\./;

function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return t;
}

async function stored(t: ReturnType<typeof setup>) {
  return t.run((ctx) => ctx.db.query("contactMessages").take(200));
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
      contactKey: "wanjiru@example.com",
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

  it("strips control characters and newlines from name and topic, but keeps newlines in the message", async () => {
    const t = setup();
    await t.mutation(api.contact.send, {
      ...VALID,
      name: "Wanjiru\r\nKamau\u0007",
      topic: "My\tbadge​",
      message: "Line one\r\nLine two\u0000 end",
    });
    const [row] = await stored(t);
    expect(row.name).toBe("Wanjiru Kamau");
    expect(row.topic).toBe("My badge");
    expect(row.message).toBe("Line one\nLine two end");
  });

  it.each([
    ["an empty name", { name: "   " }],
    ["a name over 80 characters", { name: "a".repeat(81) }],
    ["an empty contact", { contact: "" }],
    ["a contact that is neither email nor Kenyan phone", { contact: "call me maybe" }],
    ["a non-Kenyan phone", { contact: "+447700900123" }],
    ["a short Kenyan phone", { contact: "07123" }],
    ["an email without a domain", { contact: "wanjiru@" }],
    ["a non-ASCII email", { contact: "wänjiru@example.com" }],
    ["an empty topic", { topic: " " }],
    ["a topic over 120 characters", { topic: "t".repeat(121) }],
    ["a message under 10 characters", { message: "Too short" }],
    ["a message over 2000 characters", { message: "m".repeat(2001) }],
    ["a huge message (size cap before parsing)", { message: "m".repeat(200_000) }],
    ["a huge contact (size cap before parsing)", { contact: `${"a".repeat(50_000)}@example.com` }],
  ])("rejects %s with the generic error and stores nothing", async (_label, change) => {
    const t = setup();
    await expect(t.mutation(api.contact.send, { ...VALID, ...change })).rejects.toThrowError(GENERIC);
    expect(await stored(t)).toHaveLength(0);
  });

  it("rejects an unknown role at the argument validator", async () => {
    const t = setup();
    await expect(
      t.mutation(api.contact.send, { ...VALID, role: "admin" as never }),
    ).rejects.toThrowError();
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
    for (const [i, role] of CONTACT_ROLES.entries()) {
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
});

describe("per-contact throttle (3 in 10 minutes)", () => {
  it("rejects the 4th message from one contact within 10 minutes, with the generic error", async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.contact.send, VALID);
      vi.advanceTimersByTime(60_000);
    }
    await expect(t.mutation(api.contact.send, VALID)).rejects.toThrowError(GENERIC);
    expect(await stored(t)).toHaveLength(3);
  });

  it("counts a phone written different ways as the same contact", async () => {
    const t = setup();
    await t.mutation(api.contact.send, { ...VALID, contact: "0712345678" });
    await t.mutation(api.contact.send, { ...VALID, contact: "+254 712 345 678" });
    await t.mutation(api.contact.send, { ...VALID, contact: "254712345678" });
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "0712-345-678" }),
    ).rejects.toThrowError(GENERIC);
  });

  it("puts zero-width, full-width and +tag variants of one email in the same bucket", async () => {
    const t = setup();
    await t.mutation(api.contact.send, { ...VALID, contact: "wan​jiru@example.com" });
    await t.mutation(api.contact.send, { ...VALID, contact: "ｗａｎｊｉｒｕ@ｅｘａｍｐｌｅ.ｃｏｍ" });
    await t.mutation(api.contact.send, { ...VALID, contact: "wanjiru+1@example.com" });
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "Wanjiru+promo@Example.com﻿" }),
    ).rejects.toThrowError(GENERIC);
    expect((await stored(t)).map((r) => r.contactKey)).toEqual([
      "wanjiru@example.com",
      "wanjiru@example.com",
      "wanjiru@example.com",
    ]);
  });

  it("folds Gmail dots into the same bucket", async () => {
    const t = setup();
    await t.mutation(api.contact.send, { ...VALID, contact: "wan.jiru@gmail.com" });
    await t.mutation(api.contact.send, { ...VALID, contact: "w.a.n.j.i.r.u@googlemail.com" });
    await t.mutation(api.contact.send, { ...VALID, contact: "wanjiru@gmail.com" });
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "wanjiru+x@gmail.com" }),
    ).rejects.toThrowError(GENERIC);
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

describe("global write cap (30 an hour across all contacts)", () => {
  it("rejects the 31st message in an hour from distinct contacts, with the generic error", async () => {
    const t = setup();
    for (let i = 0; i < 30; i++) {
      await t.mutation(api.contact.send, { ...VALID, contact: `sender${i}@example.com` });
    }
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "sender30@example.com" }),
    ).rejects.toThrowError(GENERIC);
    expect(await stored(t)).toHaveLength(30);
  });

  it("does not spend the global budget on rejected or honeypot messages", async () => {
    const t = setup();
    for (let i = 0; i < 5; i++) {
      await t.mutation(api.contact.send, { ...VALID, contact: `bot${i}@example.com`, website: "x" });
      await expect(
        t.mutation(api.contact.send, { ...VALID, contact: `bad${i}@example.com`, message: "short" }),
      ).rejects.toThrowError(GENERIC);
    }
    for (let i = 0; i < 30; i++) {
      await t.mutation(api.contact.send, { ...VALID, contact: `sender${i}@example.com` });
    }
    expect(await stored(t)).toHaveLength(30);
  });

  it("opens up again after the hour", async () => {
    const t = setup();
    for (let i = 0; i < 30; i++) {
      await t.mutation(api.contact.send, { ...VALID, contact: `sender${i}@example.com` });
    }
    vi.advanceTimersByTime(60 * 60_000 + 1);
    await expect(
      t.mutation(api.contact.send, { ...VALID, contact: "later@example.com" }),
    ).resolves.toEqual({ ok: true });
  });
});

describe("no read path for contact messages", () => {
  it("contact.ts exports only the send mutation", () => {
    expect(Object.keys(contactModule)).toEqual(["send"]);
    const send = contactModule.send as unknown as { isMutation?: boolean };
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

describe("shared contact rules", () => {
  it("derives CONTACT_ROLES from the one role validator", () => {
    expect(CONTACT_ROLES).toEqual(contactRoleValidator.members.map((m) => m.value));
    expect(CONTACT_ROLES).toEqual(["client", "fundi", "expert", "other"]);
    expect(sources["./schema.ts"]).toContain("contactRoleValidator");
    expect(sources["./schema.ts"]).not.toMatch(/v\.literal\("client"\)/);
  });

  it("returns no errors for a valid message", () => {
    expect(validateContact(VALID)).toEqual({});
  });

  it("names each failing field (for the client's inline errors)", () => {
    expect(validateContact({ name: "", contact: "nope", role: "x", topic: "", message: "short" })).toEqual({
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
    ["０７１２３４５６７８", "+254712345678"],
    ["Someone@Example.com", "someone@example.com"],
    ["some​one@example.com⁠", "someone@example.com"],
    ["some+tag@example.com", "some+tag@example.com"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalizeContact(input)).toBe(expected);
  });

  it.each([
    ["some+tag@example.com", "some@example.com"],
    ["so.me+tag@gmail.com", "some@gmail.com"],
    ["so.me@googlemail.com", "some@gmail.com"],
    ["so.me@example.com", "so.me@example.com"],
    ["+254712345678", "+254712345678"],
  ])("keys %s as %s for the throttle", (input, expected) => {
    expect(contactKey(input)).toBe(expected);
  });

  it("cleans single-line and message fields", () => {
    expect(cleanLine("  a\r\n b\u0000​c  ")).toBe("a bc");
    expect(cleanMessage(" x\r\ny\u0007\tz ")).toBe("x\ny\tz");
  });
});
