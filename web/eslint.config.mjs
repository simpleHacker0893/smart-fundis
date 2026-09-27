import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Every visible string goes through next-intl (AGENTS.md rule 5).
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": "error",
    },
  },
  {
    // An underscore prefix marks a deliberately unused
    // arg or var (a required Next.js error-boundary prop, a test stub), so
    // it should not warn.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
