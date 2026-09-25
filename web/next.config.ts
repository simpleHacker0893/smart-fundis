import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Agent rules live in the repo-root AGENTS.md; don't let `next dev`
  // write web/AGENTS.md and web/CLAUDE.md.
  agentRules: false,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
