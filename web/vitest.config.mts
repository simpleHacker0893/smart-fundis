import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}"],
    // The first import of a Clerk-backed module (proxy, layout) is a cold
    // transform of @clerk/nextjs and can pass 5 s, especially beside a dev server.
    testTimeout: 30_000,
  },
});
