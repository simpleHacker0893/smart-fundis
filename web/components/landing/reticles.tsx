/**
 * The four corner reticles of an evidence frame (DESIGN.md "one signature
 * idea"). Decorative and never in the way of a tap. Shared by EvidenceFrame
 * and the sign-in photo panel (#24 review).
 */
export function Reticles({ inset = "inset-3" }: { inset?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${inset}`}>
      <span className="absolute top-0 left-0 size-3.5 border-t-2 border-l-2 border-foreground/70" />
      <span className="absolute top-0 right-0 size-3.5 border-t-2 border-r-2 border-foreground/70" />
      <span className="absolute bottom-0 left-0 size-3.5 border-b-2 border-l-2 border-foreground/70" />
      <span className="absolute right-0 bottom-0 size-3.5 border-r-2 border-b-2 border-foreground/70" />
    </div>
  );
}
