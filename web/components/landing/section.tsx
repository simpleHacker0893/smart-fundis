import type { ReactNode } from "react";

/**
 * One landing section: a full-width band with a hairline under it and the
 * 1280 px container (Stitch 01-landing-v3). `id` is the anchor the header,
 * tab bar and footer link to; scroll-mt clears the sticky header.
 */
export function Section({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`w-full scroll-mt-24 border-b border-line py-16 lg:scroll-mt-[72px] lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** The mono section label with its pulsing amber dot ("02 — RECORD"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 font-mono text-xs font-medium tracking-[0.25em] text-amber uppercase">
      <span aria-hidden="true" className="size-2 rounded-full bg-amber motion-safe:animate-pulse" />
      {children}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{children}</h2>;
}

/** The mono "EXAMPLE" tag every sample carries (DESIGN.md L115). */
export function ExampleTag({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded border border-foreground/20 px-3 py-1 font-mono text-xs tracking-widest text-foreground/75 uppercase">
      {children}
    </span>
  );
}
