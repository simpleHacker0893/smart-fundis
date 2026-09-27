import { afterEach, describe, expect, it, vi } from "vitest";
import { isStubEnabled, isStubName } from "./aiStub";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isStubEnabled (RAI S1+S2)", () => {
  it("is true only for exactly \"1\"", () => {
    vi.stubEnv("AI_STUB_ENABLED", "1");
    expect(isStubEnabled()).toBe(true);
  });

  it.each([undefined, "", "0", "true", "yes", " 1", "1 "])("is false for %j", (value) => {
    vi.stubEnv("AI_STUB_ENABLED", value);
    expect(isStubEnabled()).toBe(false);
  });
});

describe("isStubName", () => {
  it.each(["stub", "stub-v1", "STUB@v1", "Stub-laptop"])("is true for %j", (name) => {
    expect(isStubName(name)).toBe(true);
  });

  it.each(["", "w1", "nvidia/Cosmos-Reason2-8B", "brev-stub", " stub", "stu"])("is false for %j", (name) => {
    expect(isStubName(name)).toBe(false);
  });
});
