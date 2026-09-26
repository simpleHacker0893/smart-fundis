import path from "node:path";
import { loadEnvConfig } from "@next/env";

// Every local secret lives in the repo-root .env (D-13), the same file
// next.config.ts loads. Values are never printed, only the names of missing ones.
let loaded = false;
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  const repoRoot = path.resolve(__dirname, "..", "..");
  loadEnvConfig(repoRoot, true, { info: () => {}, error: console.error }, true);
}

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export function clerkPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || undefined;
}

/**
 * The names of what the Clerk e2e tests need but cannot find, empty when
 * ready. The secret key must be a development one: the tests create and
 * delete a throwaway User through the Clerk Backend API.
 */
export function missingE2eEnv(): string[] {
  loadRootEnv();
  const missing: string[] = [];
  if (!clerkPublishableKey()) missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY)");
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) missing.push("CLERK_SECRET_KEY");
  else if (!secret.startsWith("sk_test_")) missing.push("CLERK_SECRET_KEY from a development instance (sk_test_…)");
  if (!process.env.NEXT_PUBLIC_CONVEX_URL && !process.env.CONVEX_URL) {
    missing.push("CONVEX_URL (run `pnpm dev:convex` once)");
  }
  return missing;
}

export function skipMessage(missing: string[]): string {
  return `Clerk e2e skipped: set ${missing.join(", ")} in the repo-root .env.`;
}
