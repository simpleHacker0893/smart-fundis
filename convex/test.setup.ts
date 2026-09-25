/// <reference types="vite/client" />
// The module map convex-test needs (every Convex module, including _generated).
// This file name has two dots, so the Convex CLI never bundles it.
export const modules = import.meta.glob("./**/*.*s");
