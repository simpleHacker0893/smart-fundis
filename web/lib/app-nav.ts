import type messages from "@/messages/en.json";

type ShellMessages = (typeof messages)["AppShell"];

/** The dashboards the shell draws in V7 (D2). Admin is plain shadcn, later. */
export type ShellRole = "fundi" | "expert";

export type CategoryKey = keyof ShellMessages["categories"];
export type ItemKey = keyof ShellMessages["items"];
export type BottomKey = keyof ShellMessages["bottom"];
export type IconKey =
  | "home"
  | "verifications"
  | "publicProfile"
  | "showcase"
  | "queue"
  | "profile"
  | "trades"
  | "evidence"
  | "company"
  | "help"
  | "signOut";

/**
 * A menu row: a link, or an action the shell runs (Clerk's account page,
 * sign out). `match` marks the row current (aria-current) for a pathname.
 */
export type NavItem = {
  readonly key: ItemKey;
  readonly icon: IconKey;
} & ({ readonly href: string; readonly match?: (pathname: string) => boolean } | { readonly action: ShellAction });

export type ShellAction = "manageAccount" | "signOut";

export type NavGroup = { readonly key: CategoryKey; readonly items: readonly NavItem[] };

export type BottomItem = {
  readonly key: BottomKey;
  readonly icon: IconKey;
} & ({ readonly href: string; readonly match: (pathname: string) => boolean } | { readonly action: ShellAction });

export const ROLE_HOME: Record<ShellRole, string> = { fundi: "/fundi", expert: "/expert" };

const exact = (href: string) => (pathname: string) => pathname === href;
const within = (href: string) => (pathname: string) => pathname === href || pathname.startsWith(`${href}/`);

/** The role whose dashboard a path belongs to, or null (/dashboard, the router). */
export function roleFromPath(pathname: string): ShellRole | null {
  if (within("/fundi")(pathname)) return "fundi";
  if (within("/expert")(pathname)) return "expert";
  return null;
}

/**
 * The role's grouped menu (D2, D-65), the same in the sidebar and the More
 * sheet. Public profile shows only when the Fundi has a listed profile
 * (`fundiProfiles.myProfileId`). No item for an unshipped feature: Expert
 * History was dropped (no V7 ticket builds it).
 */
export function roleMenu(role: ShellRole | null, { publicProfileHref }: { publicProfileHref: string | null }): NavGroup[] {
  if (role === "fundi") {
    return [
      { key: "overview", items: [{ key: "home", icon: "home", href: "/fundi", match: exact("/fundi") }] },
      {
        key: "verification",
        items: [{ key: "verifications", icon: "verifications", href: "/fundi/verifications", match: within("/fundi/verifications") }],
      },
      {
        key: "profile",
        items: [
          ...(publicProfileHref ? [{ key: "publicProfile", icon: "publicProfile", href: publicProfileHref } as const] : []),
          { key: "showcase", icon: "showcase", href: "/fundi/showcase", match: within("/fundi/showcase") },
        ],
      },
    ];
  }
  if (role === "expert") {
    // The review page (/expert/<id>) belongs to the queue.
    return [{ key: "review", items: [{ key: "queue", icon: "queue", href: "/expert", match: within("/expert") }] }];
  }
  return [];
}

/** The public site, on every role (D2). */
export const SITE_GROUP: NavGroup = {
  key: "smartFundis",
  items: [
    { key: "trades", icon: "trades", href: "/trades" },
    { key: "evidence", icon: "evidence", href: "/evidence" },
    { key: "company", icon: "company", href: "/about" },
  ],
};

const HELP: NavItem = { key: "help", icon: "help", href: "/contact" };
const SIGN_OUT: NavItem = { key: "signOut", icon: "signOut", action: "signOut" };

/**
 * The footer group, pinned at the bottom and labelled ACCOUNT on every role
 * (D2): Help and Sign out sit in the same place everywhere (WCAG 3.2.6). The
 * Expert's Profile (Clerk's account page) leads the same group.
 */
export function accountGroup(role: ShellRole | null): NavGroup {
  const profile: NavItem[] = role === "expert" ? [{ key: "profile", icon: "profile", action: "manageAccount" }] : [];
  return { key: "account", items: [...profile, HELP, SIGN_OUT] };
}

/** Up to 3 of the role's most-used items; the shell adds More (D2). */
export function bottomNav(role: ShellRole | null): BottomItem[] {
  if (role === "fundi") {
    return [
      { key: "home", icon: "home", href: "/fundi", match: exact("/fundi") },
      { key: "verifications", icon: "verifications", href: "/fundi/verifications", match: within("/fundi/verifications") },
      { key: "profile", icon: "profile", href: "/fundi/showcase", match: within("/fundi/showcase") },
    ];
  }
  if (role === "expert") {
    return [
      { key: "queue", icon: "queue", href: "/expert", match: within("/expert") },
      { key: "profile", icon: "profile", action: "manageAccount" },
    ];
  }
  return [];
}

/** Initials for the avatar (never a photo): first and last name, else the email's first letter. */
export function initialsOf(name: string | null | undefined, email: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const first = words[0][0];
    const last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  return (email ?? "").trim().slice(0, 1).toUpperCase();
}
