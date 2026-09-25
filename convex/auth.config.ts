import type { AuthConfig } from "convex/server";

// Clerk issues the `convex` JWT template; Convex validates it against the
// Clerk Frontend API URL set on each deployment with `convex env set`.
const clerkFrontendApiUrl = process.env.CLERK_FRONTEND_API_URL;
if (!clerkFrontendApiUrl) {
  throw new Error(
    "CLERK_FRONTEND_API_URL is not set on this Convex deployment. " +
      "Set it with `pnpm exec convex env set CLERK_FRONTEND_API_URL <Clerk Frontend API URL>`.",
  );
}

export default {
  providers: [
    {
      domain: clerkFrontendApiUrl,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
