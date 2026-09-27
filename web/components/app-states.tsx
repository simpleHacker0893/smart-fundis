"use client";

import { useTranslations } from "next-intl";
import { Component, type ReactNode } from "react";
import { cn } from "cn";
import { PANEL, SECTION_LABEL } from "@/components/ui/app-type";
import { SECONDARY_PILL } from "@/components/ui/pill";
import { STATUS_GLYPHS } from "@/components/ui/status-chip";

/**
 * App-mode states shared by the role pages (DESIGN.md D9): the empty,
 * loading and error panels and the per-card error boundary. No amber
 * anywhere here: errors and ✕ are neutral. Class strings live in
 * components/ui/app-type.ts.
 */

/** A neutral error line: a white ✕ outside the alert, so the alert reads only the words. */
export function ErrorLine({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-base text-foreground", className)}>
      <span aria-hidden="true">{STATUS_GLYPHS.failed}</span>
      <span id={id} role="alert">
        {children}
      </span>
    </p>
  );
}

/**
 * Empty or not-available state (D9): an optional mono tag, one plain
 * sentence and at most one action (`children`). No image.
 */
export function EmptyPanel({ tag, body, children }: { tag?: string; body: string; children?: ReactNode }) {
  return (
    <div data-testid="empty-panel" className={cn(PANEL, "flex flex-col gap-2")}>
      {tag ? <p className={SECTION_LABEL}>{tag}</p> : null}
      <p className="text-base">{body}</p>
      {children}
    </div>
  );
}

/**
 * Error panel (D9): ✕ "COULDN'T LOAD", the reason, and an outlined Try
 * again. `tag` and `retry` default to the Verifications copy; a page with its
 * own namespace (the Expert queue) passes its own.
 */
export function ErrorPanel({
  body,
  onRetry,
  tag,
  retry,
}: {
  body: string;
  onRetry: () => void;
  tag?: string;
  retry?: string;
}) {
  const t = useTranslations("Verifications.error");
  return (
    <div data-testid="error-panel" className={cn(PANEL, "flex flex-col gap-3")}>
      <p className={cn(SECTION_LABEL, "flex items-center gap-2 text-foreground")}>
        <span aria-hidden="true">{STATUS_GLYPHS.failed}</span>
        <span>{tag ?? t("tag")}</span>
      </p>
      <p role="alert" className="text-base">
        {body}
      </p>
      <button type="button" className={SECONDARY_PILL} onClick={onRetry}>
        {retry ?? t("retry")}
      </button>
    </div>
  );
}

/** Skeleton rows matching the hairline row layout (D9), never amber, still under reduced motion. */
export function SkeletonRows({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="flex min-h-14 items-center justify-between gap-4 border-b border-line py-3"
        >
          <span className="flex flex-1 flex-col gap-2">
            <span className="h-4 w-2/3 animate-pulse rounded bg-panel motion-reduce:animate-none" />
            <span className="h-3 w-1/3 animate-pulse rounded bg-panel motion-reduce:animate-none" />
          </span>
          <span className="h-7 w-24 animate-pulse rounded border border-line motion-reduce:animate-none" />
        </span>
      ))}
    </div>
  );
}

/** A card-sized skeleton block. */
export function SkeletonCard({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className={cn(PANEL, "flex flex-col gap-3")}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="h-3 w-1/3 animate-pulse rounded bg-background motion-reduce:animate-none" />
      <span aria-hidden="true" className="h-7 w-1/2 animate-pulse rounded bg-background motion-reduce:animate-none" />
      <span aria-hidden="true" className="h-4 w-full animate-pulse rounded bg-background motion-reduce:animate-none" />
    </div>
  );
}

type BoundaryProps = { children: ReactNode; fallback: (retry: () => void) => ReactNode };

/**
 * Keeps a failed query inside its own card (D9): Convex's useQuery throws on
 * a server error, and this boundary shows the card's error panel while the
 * rest of the page works. Try again remounts the card, which resubscribes.
 */
export class CardBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback(() => this.setState({ failed: false }));
    return this.props.children;
  }
}

/** A CardBoundary whose fallback is the standard error panel. */
export function ScopedErrors({ body, children }: { body: string; children: ReactNode }) {
  return <CardBoundary fallback={(retry) => <ErrorPanel body={body} onRetry={retry} />}>{children}</CardBoundary>;
}
