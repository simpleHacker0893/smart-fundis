import { cn } from "cn";

/**
 * Pill buttons (DESIGN.md L85-90): fully rounded, uppercase and bold.
 * Primary is the amber fill with a graphite label; secondary is a 1 px
 * --line outline whose border brightens on hover. The one place pill
 * classes live, for links styled as buttons in the shell.
 */
// Both pills lift 2 px on hover (DESIGN.md L90), only when motion is allowed.
const BASE =
  "inline-flex items-center justify-center rounded-full font-bold uppercase whitespace-nowrap transition motion-safe:hover:-translate-y-0.5";

const VARIANTS = {
  // The Stitch screen's soft amber glow: light, not a drop shadow (DESIGN.md L85).
  primary:
    "bg-primary text-primary-foreground shadow-[0_0_15px_color-mix(in_srgb,var(--amber)_20%,transparent)] hover:brightness-110",
  secondary: "border border-line text-foreground hover:border-foreground/40",
} as const;

const SIZES = {
  /** The REFERENCE's compact 32 px header pill; wrap it in PILL_HIT_AREA. */
  compact: "h-8 px-4 text-xs tracking-wider",
  /** The desktop header pill, 40 px; wrap it in PILL_HIT_AREA. */
  header: "h-10 px-5 text-xs tracking-wider",
  /** A 48 px pill, full width on mobile (DESIGN.md L90); callers widen it with sm:w-auto. */
  full: "h-12 w-full px-8 text-xs tracking-wider",
} as const;

/** Focus ring on the visible pill when its 48 px hit-area parent is focused. */
const FOCUS_IN_HIT_AREA =
  "group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring";

/**
 * A 48 px tap target around a compact pill (HANDOFF §6: the exports' 32 px
 * JOIN pill was too small). The pill keeps its look; the link gets the height.
 */
export const PILL_HIT_AREA = "group inline-flex h-12 items-center outline-none";

export function pillClass({
  variant,
  size,
  inHitArea = false,
  className,
}: {
  variant: keyof typeof VARIANTS;
  size: keyof typeof SIZES;
  inHitArea?: boolean;
  className?: string;
}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], inHitArea && FOCUS_IN_HIT_AREA, className);
}
