import { useTranslations } from "next-intl";
import { cn } from "cn";

/**
 * The status chip (DESIGN.md D4): a neutral 28 px chip with a 1 px hairline,
 * a 4 px radius, mono 12 px and one glyph plus the words. Never amber, never
 * coloured and never ✓ (✓ is the Badge's). The glyph is decorative; the words
 * carry the meaning, so status is never shown by the glyph alone. Tags use
 * CHIP (chip.ts) instead, so the two never look alike.
 */
export const STATUS_GLYPHS = {
  // Assessment
  queued: "◌",
  analyzing: "◌",
  awaiting_review: "◐",
  appealed: "◐",
  approved: "■",
  reshoot: "↻",
  rejected: "○",
  failed: "✕",
  // Listing (the Fundi's own status card)
  listed: "●",
  listed_unverified: "●",
  listing_off: "○",
  hidden_by_admin: "✕",
} as const;

export type ChipStatus = keyof typeof STATUS_GLYPHS;

/** Wraps rather than truncates (D3 rule 9), so it grows past 28 px for long labels. */
export const STATUS_CHIP =
  "inline-flex min-h-7 items-center gap-2 self-start rounded border border-line px-2 py-0.5 font-mono text-xs tracking-[0.08em] text-foreground";

export function StatusChip({ status, className }: { status: ChipStatus; className?: string }) {
  const t = useTranslations("StatusChip");
  return (
    <span className={cn(STATUS_CHIP, className)}>
      <span aria-hidden="true">{STATUS_GLYPHS[status]}</span>
      <span>{t(status)}</span>
    </span>
  );
}
