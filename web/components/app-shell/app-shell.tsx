"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAvailable } from "@/components/convex-available";
import { SIGNED_OUT_PATH } from "@/lib/auth-routes";
import {
  bottomNav,
  FOOTER_ITEMS,
  initialsOf,
  roleFromPath,
  roleMenu,
  type ShellAction,
  type ShellRole,
  SITE_GROUP,
} from "@/lib/app-nav";
import { AppHeader } from "./app-header";
import { AvatarSheet } from "./avatar-sheet";
import { BottomNav } from "./bottom-nav";
import { ConnectionStrip } from "./connection-strip";
import { NavMenu } from "./nav-menu";
import { Sheet, useSheet } from "./sheet";
import { ShellSidebarContext } from "./shell-context";
import { Sidebar } from "./sidebar";
import { useCollapsed } from "./use-collapsed";

export type AppShellProps = {
  children: ReactNode;
  /**
   * The primary action at the top of the sidebar, per role (D2). Fundi:
   * <AddVideoLink /> in phase A; phase B passes its Add video sheet trigger
   * (built on PrimaryActionButton). Roles without one get none.
   */
  primaryAction?: Partial<Record<ShellRole, ReactNode>>;
};

/** What the shell reads from Convex: the roles and the Fundi's listed profile. */
type ShellData = { dualRole: boolean; publicProfileHref: string | null };
const NO_DATA: ShellData = { dualRole: false, publicProfileHref: null };

/**
 * The app shell for every role route (D2, D-65, #67): the header, the
 * desktop sidebar (collapsible to a rail), the mobile bottom nav with the
 * More sheet, the avatar sheet and the connection strip. The role comes
 * from the path (/fundi*, /expert*); every page still guards its own role.
 */
export function AppShell(props: AppShellProps) {
  // Convex hooks throw outside a Convex provider (a build with no Convex URL).
  if (!useConvexAvailable()) return <ShellFrame {...props} data={NO_DATA} />;
  return <ConnectedShell {...props} />;
}

function ConnectedShell(props: AppShellProps) {
  const role = roleFromPath(usePathname());
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const profile = useQuery(api.fundiProfiles.myProfileId, isAuthenticated && role === "fundi" ? {} : "skip");
  const roles = me?.roles;
  const data: ShellData = {
    dualRole: roles !== undefined && roles.base === "fundi" && roles.expert,
    publicProfileHref: profile?.publicListing ? `/f/${profile.id}` : null,
  };
  return <ShellFrame {...props} data={data} />;
}

function ShellFrame({ children, primaryAction, data }: AppShellProps & { data: ShellData }) {
  const t = useTranslations("AppShell");
  const pathname = usePathname();
  const role = roleFromPath(pathname);
  const { user } = useUser();
  const clerk = useClerk();
  const [collapsed, toggleCollapsed] = useCollapsed();
  const sidebarId = useId();
  const { ref: menuRef, open: openMenu, close: closeMenu } = useSheet();
  const { ref: accountRef, open: openAccount, close: closeAccount } = useSheet();

  // A new page closes any open sheet (the shell stays mounted across pages).
  useEffect(() => {
    closeMenu();
    closeAccount();
  }, [pathname, closeMenu, closeAccount]);

  const name = user?.fullName ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const shellUser = { initials: initialsOf(name, email), name, email };

  function run(action: ShellAction) {
    closeMenu();
    closeAccount();
    if (action === "manageAccount") clerk.openUserProfile();
    else void clerk.signOut({ redirectUrl: SIGNED_OUT_PATH });
  }

  const menu = {
    groups: roleMenu(role, { publicProfileHref: data.publicProfileHref }),
    site: SITE_GROUP,
    footer: FOOTER_ITEMS,
    pathname,
    onAction: run,
  };

  return (
    <ShellSidebarContext.Provider value={{ collapsed }}>
      <div data-app-shell className="flex min-h-full flex-1 flex-col">
        <AppHeader
          role={role}
          initials={shellUser.initials}
          sidebarId={sidebarId}
          collapsed={collapsed}
          onToggleSidebar={toggleCollapsed}
          onAvatar={openAccount}
        />
        <ConnectionStrip />
        <div className="flex flex-1">
          <Sidebar id={sidebarId} collapsed={collapsed} primaryAction={role ? primaryAction?.[role] : null} menu={menu} />
          {/* The skip link's target. Bottom padding keeps content clear of the fixed bottom nav. */}
          <div
            id="main-content"
            tabIndex={-1}
            className="flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none lg:pb-0"
          >
            <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">{children}</div>
          </div>
        </div>
        <BottomNav items={bottomNav(role)} pathname={pathname} onAction={run} onMore={openMenu} />
        <Sheet ref={menuRef} title={t("sheet.menuTitle")}>
          <NavMenu {...menu} onNavigate={closeMenu} />
        </Sheet>
        <AvatarSheet
          ref={accountRef}
          user={shellUser}
          role={role}
          dualRole={data.dualRole}
          onManage={() => run("manageAccount")}
          onSignOut={() => run("signOut")}
        />
      </div>
    </ShellSidebarContext.Provider>
  );
}
