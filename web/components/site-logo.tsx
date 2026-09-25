/**
 * The Smart Fundis mark: an evidence frame (a panel tile with four corner
 * reticles, as on every inspected video frame) holding an amber verdict
 * check. It refines DESIGN.md L92-98's frame-and-check logo so it reads at
 * 32-40 px. Decorative: the wordmark next to it carries the name.
 */
export function SiteLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false" className={className}>
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10" className="fill-panel stroke-foreground/15" strokeWidth="1.5" />
      {/* Corner reticles: the evidence frame. */}
      <path
        d="M9 15V11.5A2.5 2.5 0 0 1 11.5 9H15 M25 9h3.5A2.5 2.5 0 0 1 31 11.5V15 M31 25v3.5a2.5 2.5 0 0 1-2.5 2.5H25 M15 31h-3.5A2.5 2.5 0 0 1 9 28.5V25"
        className="stroke-foreground/70"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* The verdict. */}
      <path
        d="M13.5 20.4 L18 24.6 L26.5 15.4"
        className="stroke-amber"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
