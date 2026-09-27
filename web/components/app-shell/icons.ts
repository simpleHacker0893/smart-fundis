import {
  Building2,
  CircleHelp,
  House,
  Inbox,
  Link2,
  ListChecks,
  LogOut,
  type LucideIcon,
  ScanSearch,
  UserRound,
  Wrench,
} from "lucide-react";
import type { IconKey } from "@/lib/app-nav";

/** The shell's 20 / 24 px line icons (D2), one per menu row. Decorative: the label names the row. */
export const NAV_ICONS: Record<IconKey, LucideIcon> = {
  home: House,
  verifications: ListChecks,
  publicProfile: UserRound,
  showcase: Link2,
  queue: Inbox,
  profile: UserRound,
  trades: Wrench,
  evidence: ScanSearch,
  company: Building2,
  help: CircleHelp,
  signOut: LogOut,
};
