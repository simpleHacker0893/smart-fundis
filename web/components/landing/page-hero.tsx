import type { ReactNode } from "react";
import { Section, SectionLabel } from "@/components/landing/section";

/**
 * The hero every content page shares (#24 review): a mono label, the h1,
 * a dim sub-line, optional actions, and optionally a frame or readout
 * beside it on desktop (text 7 / aside 5, or text 5 / aside 7 when the
 * aside is the page's evidence frame).
 */
export function PageHero({
  label,
  title,
  body,
  actions,
  aside,
  asideWide = false,
}: {
  label: string;
  /** One string, or several lines (each rendered as a block). */
  title: string | string[];
  body: string;
  actions?: ReactNode;
  aside?: ReactNode;
  asideWide?: boolean;
}) {
  const lines = typeof title === "string" ? [title] : title;
  const textSpan = aside ? (asideWide ? "lg:col-span-5" : "lg:col-span-7") : "lg:col-span-12";
  const asideSpan = asideWide ? "lg:col-span-7" : "lg:col-span-5";

  return (
    <Section id="top" className="film-grain py-12 sm:py-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className={textSpan}>
          <SectionLabel>{label}</SectionLabel>
          <h1 className="mb-6 text-5xl leading-[1.05] font-black tracking-tight sm:text-6xl lg:text-7xl">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className={`max-w-xl text-base leading-relaxed text-foreground/75 ${actions ? "mb-8" : ""}`}>{body}</p>
          {actions}
        </div>
        {aside && <div className={asideSpan}>{aside}</div>}
      </div>
    </Section>
  );
}
