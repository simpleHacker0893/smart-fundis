"use client";

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

// next.config.ts fills NEXT_PUBLIC_CONVEX_URL from the root CONVEX_URL (D-13).
// The client is created lazily so importing the layout (tests, metadata) never
// needs the URL; rendering without it fails loudly.
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
      {children}
    </ConvexProviderWithClerk>
  );
}
