import type { AuthConfig } from "convex/server";

// Clerk issues the `convex` JWT template; Convex validates it against the
// Clerk Frontend API URL set on each deployment with `convex env set`.
export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
