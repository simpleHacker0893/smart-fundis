"use client";

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { StoreUserOnAuth } from "@/components/store-user-on-auth";

// next.config.ts fills NEXT_PUBLIC_CONVEX_URL from the root CONVEX_URL (D-13).
// The client is created when this module loads, but only if the URL is set, so
// importing the layout without it (tests, metadata) doesn't throw. Rendering
// the provider without the URL fails loudly instead.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Must sit inside ClerkProvider: Convex reads the Clerk session through useAuth
// and fetches the `convex` JWT template for every request.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Run `pnpm dev:convex` once.");
  }
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <StoreUserOnAuth />
      {children}
    </ConvexProviderWithClerk>
  );
}
