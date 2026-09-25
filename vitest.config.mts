import { defineConfig } from "vitest/config";

// Convex function tests (convex-test). web/ has its own vitest config and runs
// under `pnpm -r test`; this one only covers convex/ (D-11).
export default defineConfig({
  test: {
    include: ["convex/**/*.test.ts"],
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
