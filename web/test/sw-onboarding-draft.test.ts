import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";

// The Kiswahili drafted for #37 (under D-29) lives beside
// sw.footer.draft.json, unwired, for the R-20 check. D-64 (English only for
// now) supersedes D-29: new keys get no Kiswahili draft, so the draft is not
// required to cover them. What it has must still match en.json.
const DRAFT = fileURLToPath(new URL("../messages/drafts/sw.onboarding.draft.json", import.meta.url));

function paths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    paths(v, prefix ? `${prefix}.${k}` : k),
  );
}

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
}

describe("Kiswahili draft for onboarding, /dashboard and /fundi (#37, R-20; frozen by D-64)", () => {
  const draft = existsSync(DRAFT) ? JSON.parse(readFileSync(DRAFT, "utf8")) : {};

  it("still exists, with the /fundi keys drafted for #37", () => {
    expect(existsSync(DRAFT)).toBe(true);
    for (const path of ["FundiPage.title", "FundiPage.loading", "FundiPage.unavailable"]) {
      expect(typeof get(draft, path), path).toBe("string");
    }
  });

  it("has no keys that en.json lacks, and keeps each ICU argument", () => {
    for (const path of paths(draft).filter((p) => p !== "_note")) {
      const english = get(en, path);
      expect(typeof english, `SW key not in en.json: ${path}`).toBe("string");
      const args = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(args(get(draft, path) as string), path).toEqual(args(english as string));
    }
  });

  it("is marked as an unreviewed draft (R-20)", () => {
    expect(draft._note).toMatch(/DRAFT/);
    expect(draft._note).toMatch(/R-20/);
  });
});
