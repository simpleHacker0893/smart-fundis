import { describe, expect, it } from "vitest";
import { isProtectedPath, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

describe("proxy route protection", () => {
  it.each(["/dashboard", "/dashboard/", "/dashboard/x", "/dashboard/x/y"])(
    "requires sign-in for %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  it.each(["/", "/sign-in", "/sign-in/factor-one", "/sign-up", "/dashboards", "/roadmap"])(
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
  it("keeps Clerk's recommended matcher (pages, API routes and /__clerk)", async () => {
    const { config } = await import("@/proxy");
    expect(config.matcher).toEqual([
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
      "/(api|trpc)(.*)",
      "/__clerk/(.*)",
    ]);
  });
});
