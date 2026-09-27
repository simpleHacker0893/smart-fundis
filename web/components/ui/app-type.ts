/**
 * App-mode class strings (DESIGN.md D1, D3): the type ladder, panels and
 * the page column. A plain module (no "use client"), so server pages can
 * import the strings themselves rather than client references.
 */

/** Page title: 28 px on mobile, 40 px from 1024 px, weight 600, -0.02em. */
export const PAGE_TITLE = "text-[28px] leading-tight font-semibold tracking-[-0.02em] break-words lg:text-[40px]";

/** Section label: mono 12 px, UPPERCASE, 0.26em, dim. */
export const SECTION_LABEL = "font-mono text-xs tracking-[0.26em] text-dim uppercase";

/** Meta line: mono 12 px, dim, tracked, tabular figures. */
export const META = "font-mono text-xs tracking-[0.08em] text-dim uppercase tabular-nums";

/** A bordered panel: 4 px radius, 1 px hairline, the panel colour. No shadow. */
export const PANEL = "rounded border border-line bg-panel p-4 lg:p-6";

/** A mono tag (not a status chip): "SHOWCASE — NOT VERIFIED". */
export const MONO_TAG =
  "inline-flex self-start rounded-full border border-line px-3 py-1 font-mono text-xs tracking-[0.08em] text-foreground uppercase";

/** A small outlined mono tag ("AI", "SAFETY", "SAFETY CHECK"), 4 px radius, never amber. */
export const OUTLINE_TAG =
  "inline-flex shrink-0 items-center self-start rounded border border-foreground/40 px-1.5 py-0.5 font-mono text-xs tracking-[0.08em] text-foreground uppercase";

/** The page column: 16 / 24 / 32 px gutters, sections 32 px apart (48 px on desktop). */
export const PAGE_MAIN = "flex w-full flex-1 flex-col gap-8 px-4 py-8 md:px-6 lg:gap-12 lg:px-8 lg:py-12";
