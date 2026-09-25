"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The auth screens (07, 08, 09 in Stitch) end with the legal line only. */
function isAuthPath(pathname: string): boolean {
  return /^\/(sign-in|sign-up|signed-out)(\/|$)/.test(pathname);
}

/**
 * Picks the footer by route: the slim legal footer on sign-in, sign-up and
 * signed-out, the full footer everywhere else. Both footers are rendered on
 * the server and passed in, so this only chooses.
 */
export function FooterSwitch({ full, slim }: { full: ReactNode; slim: ReactNode }) {
  return <>{isAuthPath(usePathname()) ? slim : full}</>;
}
