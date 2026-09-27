import { AppShell } from "@/components/app-shell/app-shell";
import { AddVideoLink } from "@/components/app-shell/primary-action";

/**
 * Every role route (/dashboard, /fundi, /expert) sits in the app shell
 * (DESIGN.md D2, #67): no marketing header or footer.
 */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell primaryAction={{ fundi: <AddVideoLink /> }}>{children}</AppShell>;
}
