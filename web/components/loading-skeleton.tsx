/**
 * The loading state shared by the role pages and onboarding: a live status
 * with a visible label and a pulsing bar (still under reduced motion).
 */
export function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="text-base text-foreground/75">{label}</span>
      <span aria-hidden="true" className="h-12 w-full animate-pulse rounded bg-panel motion-reduce:animate-none" />
    </div>
  );
}
