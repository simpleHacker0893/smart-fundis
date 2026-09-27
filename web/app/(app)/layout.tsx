import { AddVideoAction, AddVideoProvider } from "@/components/add-video-sheet";
import { AppShell } from "@/components/app-shell/app-shell";

/**
 * Every role route (/dashboard, /fundi, /expert) sits in the app shell
 * (DESIGN.md D2, #67): no marketing header or footer. The Fundi's primary
 * action opens the Add video sheet (prompt 26), which AddVideoProvider
 * renders once, outside the desktop-only sidebar.
 */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AddVideoProvider>
      <AppShell primaryAction={{ fundi: <AddVideoAction /> }}>{children}</AppShell>
    </AddVideoProvider>
  );
}
