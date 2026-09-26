import { describe, expect, it } from "vitest";
import { isProtectedPath, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

describe("proxy route protection", () => {
  it.each(["/dashboard", "/dashboard/", "/dashboard/x", "/dashboard/x/y"])(
    "requires sign-in for %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  // Spec §4: sign-in is required for /onboarding and every role dashboard.
  it.each(["/onboarding", "/application-pending", "/fundi", "/fundi/x", "/expert", "/admin/y"])(
    "requires sign-in for %s (spec §4)",
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  it.each(["/", "/sign-in", "/sign-in/factor-one", "/sign-up", "/dashboards", "/roadmap", "/fundis", "/f/abc", "/experts"])(
    "keeps %s public",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );

  it("never protects the sign-in and sign-up pages themselves", () => {
    expect(isProtectedPath(SIGN_IN_PATH)).toBe(false);
    expect(isProtectedPath(SIGN_UP_PATH)).toBe(false);
  });
});

describe("proxy matcher", () => {
  // Next treats each matcher entry as a path regex. Check behaviour on real
  // paths rather than copying the strings, so a harmful edit fails here.
  async function runsFor(path: string): Promise<boolean> {
    const { config } = await import("@/proxy");
    return config.matcher.some((m) => new RegExp(`^${m}$`).test(path));
  }

  it.each(["/", "/dashboard", "/dashboard/x", "/sign-in", "/api/x", "/trpc/y", "/__clerk/v1/client"])(
    "runs the proxy for %s",
    async (path) => {
      expect(await runsFor(path)).toBe(true);
    },
  );

  it.each(["/_next/webpack-hmr", "/_next/static/chunk.js", "/favicon.ico", "/images/hero.webp", "/styles.css"])(
    "skips Next internals and static file %s",
    async (path) => {
      expect(await runsFor(path)).toBe(false);
    },
  );
});
