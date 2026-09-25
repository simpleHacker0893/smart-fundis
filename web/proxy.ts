import { clerkMiddleware } from "@clerk/nextjs/server";
import { isProtectedPath, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

// Next.js 16 proxy (was middleware.ts). Signed-out visits to protected paths are
// sent to sign-in. The page itself still runs auth.protect(): that is the guard.
export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedPath(req.nextUrl.pathname)) await auth.protect();
  },
  { signInUrl: SIGN_IN_PATH, signUpUrl: SIGN_UP_PATH },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
