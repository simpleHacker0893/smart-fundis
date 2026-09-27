import { v } from "convex/values";
import { describe, expect, it } from "vitest";
import { conforms } from "./conforms";

const shape = v.object({
  id: v.string(),
  n: v.number(),
  ok: v.boolean(),
  kind: v.union(v.literal("a"), v.literal("b")),
  tags: v.array(v.string()),
  read: v.union(v.string(), v.null()),
  note: v.optional(v.string()),
});
const good = { id: "x", n: 1, ok: true, kind: "a", tags: ["t"], read: null };

describe("conforms", () => {
  it("accepts a matching value, with or without the optional field", () => {
    expect(conforms(shape, good)).toBe(true);
    expect(conforms(shape, { ...good, note: "hi" })).toBe(true);
  });
  it.each([
    ["undefined (body was not JSON)", undefined],
    ["null", null],
    ["an array", [good]],
    ["a string", "{}"],
    ["a missing required field", { ...good, id: undefined }],
    ["an extra field", { ...good, extra: 1 }],
    ["a wrong type", { ...good, n: "1" }],
    ["a non-finite number", { ...good, n: Number.POSITIVE_INFINITY }],
    ["a literal outside the union", { ...good, kind: "c" }],
    ["a bad array element", { ...good, tags: [1] }],
    ["a wrong-typed optional", { ...good, note: 3 }],
  ])("refuses %s", (_label, value) => {
    expect(conforms(shape, value)).toBe(false);
  });

  it.each(["toString", "constructor"])(
    "refuses a body with an inherited-only key (%s) instead of falling through to it",
    (key) => {
      expect(conforms(shape, { ...good, [key]: "x" })).toBe(false);
    },
  );
});
