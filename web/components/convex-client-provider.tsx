"use client";

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexAvailableContext } from "@/components/convex-available";
import { StoreUserOnAuth } from "@/components/store-user-on-auth";

// next.config.ts fills NEXT_PUBLIC_CONVEX_URL from the root CONVEX_URL (D-13).
// The client is created when this module loads, but only if the URL is set.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Warn once, when the module loads, rather than on every render.
if (!convex) {
  console.warn(
    "NEXT_PUBLIC_CONVEX_URL is not set, so pages render without Convex. Run `pnpm dev:convex` once.",
  );
}

// Must sit inside ClerkProvider: Convex reads the Clerk session through useAuth
// and fetches the `convex` JWT template for every request.
//
// Without a URL (a build with no root .env, such as CI) it renders the
// children without Convex and warns once, so public pages still prerender.
// Components that call Convex hooks check useConvexAvailable() and fall back
// (the contact form uses mailto); the store hook is not rendered without a client.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return children;
  }
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ConvexAvailableContext value={true}>
        <StoreUserOnAuth />
        {children}
      </ConvexAvailableContext>
    </ConvexProviderWithClerk>
  );
}
