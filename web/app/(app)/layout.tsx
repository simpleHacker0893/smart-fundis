import { AddVideoAction } from "@/components/add-video-sheet";
import { AppShell } from "@/components/app-shell/app-shell";

/**
 * Every role route (/dashboard, /fundi, /expert) sits in the app shell
 * (DESIGN.md D2, #67): no marketing header or footer. The Fundi's primary
 * action opens the Add video sheet (prompt 26).
 */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell primaryAction={{ fundi: <AddVideoAction /> }}>{children}</AppShell>;
}
