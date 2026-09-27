/*
 * The app-mode type ladder and readout parts shared by /expert and
 * /expert/[assessmentId] (DESIGN.md D1, D5, D9; #67). Neutral only: amber is
 * reserved for the one primary pill, the active-nav bar, the focus ring and
 * the Badge tick, so nothing here uses it.
 */

export const PAGE_TITLE = "text-[28px] leading-tight font-semibold tracking-[-0.02em] break-words lg:text-[40px]";
export const SECTION_LABEL = "font-mono text-xs tracking-[0.26em] text-dim uppercase";
export const META = "font-mono text-xs tracking-[0.08em] text-dim uppercase tabular-nums";
/** A small outlined mono tag ("AI", "SAFETY", "SAFETY CHECK"), 4 px radius. */
export const OUTLINE_TAG =
  "inline-flex shrink-0 items-center self-start rounded border border-foreground/40 px-1.5 py-0.5 font-mono text-xs tracking-[0.08em] text-foreground uppercase";
/** Page gutters and section rhythm: 16 / 32 px on mobile, 32 / 48 px on desktop. */
export const PAGE = "flex w-full flex-1 flex-col gap-8 px-4 py-8 lg:gap-12 lg:px-8 lg:py-12";
/** An outlined 48 px pill for secondary actions (Show all trades, Try again). */
export const OUTLINE_PILL =
  "inline-flex min-h-12 items-center justify-center self-start rounded-full border border-line px-6 font-mono text-xs font-bold tracking-[0.12em] text-foreground uppercase hover:border-foreground/40";
