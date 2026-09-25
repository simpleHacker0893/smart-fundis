/**
 * The Smart Fundis mark (DESIGN.md L92-98): an evidence frame in 70% white
 * with an amber verdict check. Decorative; the wordmark next to it is the name.
 * Replaces the Material "verified" glyph the Stitch exports use.
 */
export function SiteLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className={className}>
      <rect
        x="2.6"
        y="2.6"
        width="18.8"
        height="18.8"
        rx="6"
        strokeWidth="2"
        className="stroke-foreground/70"
      />
      <path
        d="M7 12.4 L10.6 15.8 L17.4 8.4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-amber"
      />
    </svg>
  );
}
