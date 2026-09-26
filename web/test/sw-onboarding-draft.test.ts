import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";

// D-29 wants every string in en.json and sw.json, but the UI ships English
// only until Kiswahili is wired (V2). Until then the Kiswahili for #37 lives
// in a draft beside sw.footer.draft.json, unwired, for the R-20 check.
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

describe("Kiswahili draft for onboarding and /dashboard (#37, D-29, R-20)", () => {
  const draft = existsSync(DRAFT) ? JSON.parse(readFileSync(DRAFT, "utf8")) : {};
  const scope = {
    Onboarding: en.Onboarding,
    DashboardPage: en.DashboardPage,
    Landing: { trades: { names: en.Landing.trades.names } },
  };

  it("has a Kiswahili string for every key the flow shows", () => {
    for (const path of paths(scope)) {
      const sw = get(draft, path);
      expect(typeof sw === "string" && sw.length > 0, `missing SW draft for ${path}`).toBe(true);
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
