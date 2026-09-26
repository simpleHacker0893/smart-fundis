"use client";

import { createContext, useContext } from "react";

/**
 * Whether a Convex client is mounted above. ConvexClientProvider sets it to
 * true; without NEXT_PUBLIC_CONVEX_URL (a build with no root .env) it stays
 * false, and components that call Convex hooks render a fallback instead,
 * because those hooks throw outside a Convex provider.
 */
export const ConvexAvailableContext = createContext(false);

export function useConvexAvailable(): boolean {
  return useContext(ConvexAvailableContext);
}
