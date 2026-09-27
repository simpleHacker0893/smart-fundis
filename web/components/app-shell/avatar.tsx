"use client";

import { UserRound } from "lucide-react";
import { cn } from "cn";

/** Initials in a hairline circle, never a photo (D2). A person icon when there are none. */
export function Initials({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel font-mono text-xs font-semibold tracking-[0.08em] text-foreground",
        className,
      )}
    >
      {initials || <UserRound className="size-4" strokeWidth={1.5} />}
    </span>
  );
}
