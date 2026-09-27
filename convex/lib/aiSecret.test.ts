import { describe, expect, it } from "vitest";
import { isWorkerAuthorized } from "./aiSecret";

const SECRET = "s3cret-value-for-tests";

describe("isWorkerAuthorized (spec §6)", () => {
  it("accepts the exact bearer secret", async () => {
    expect(await isWorkerAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });
  it.each([
    ["no header", null],
    ["a wrong secret of the same length", `Bearer ${"x".repeat(SECRET.length)}`],
    ["a longer secret", `Bearer ${SECRET}x`],
    ["a prefix of the secret", `Bearer ${SECRET.slice(0, 5)}`],
    ["no Bearer scheme", SECRET],
    ["a lowercase scheme", `bearer ${SECRET}`],
    ["an empty token", "Bearer "],
  ])("refuses %s", async (_label, header) => {
    expect(await isWorkerAuthorized(header, SECRET)).toBe(false);
  });
  it("refuses everything when the secret is not configured", async () => {
    expect(await isWorkerAuthorized("Bearer ", "")).toBe(false);
    expect(await isWorkerAuthorized("Bearer ", undefined)).toBe(false);
    expect(await isWorkerAuthorized("Bearer anything", undefined)).toBe(false);
  });
});
