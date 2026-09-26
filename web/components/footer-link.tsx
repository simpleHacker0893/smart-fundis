"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A footer link that knows when it is the current page: then it is white
 * with a 2 px amber underline and aria-current="page" (#27). Otherwise it
 * is light grey and turns white on hover. 44 px tall below 640 px.
 */
export function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = href.split(/[?#]/)[0] === pathname && !href.includes("#");

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex min-h-11 items-center text-[13px] transition-colors hover:text-foreground sm:min-h-0 sm:py-1 ${
        current
          ? "text-foreground underline decoration-amber decoration-2 underline-offset-4"
          : "text-foreground/70"
      }`}
    >
      {children}
    </Link>
  );
}
