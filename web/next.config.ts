import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Every local secret lives in the repo-root .env (and .env.local, which
// `convex dev` writes). Load them before Next reads its own env, so web/
// never needs an env file of its own. Deployed builds get theirs from Vercel.
// forceReload (4th arg) is required: Next has already run loadEnvConfig for
// web/ by now, and without it @next/env returns that cached result and
// silently skips the repo root.
const repoRoot = path.resolve(process.cwd(), "..");
loadEnvConfig(repoRoot, process.env.NODE_ENV !== "production", console, true);

// `convex dev` writes CONVEX_URL and `clerk env pull` writes CLERK_PUBLISHABLE_KEY;
// the browser needs both as NEXT_PUBLIC_. `||=` (not `??=`) because the .env
// template leaves the NEXT_PUBLIC_ names present but empty.
process.env.NEXT_PUBLIC_CONVEX_URL ||= process.env.CONVEX_URL;
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||= process.env.CLERK_PUBLISHABLE_KEY;

const nextConfig: NextConfig = {
  // Agent rules live in the repo-root AGENTS.md; don't let `next dev`
  // write web/AGENTS.md and web/CLAUDE.md.
  agentRules: false,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
