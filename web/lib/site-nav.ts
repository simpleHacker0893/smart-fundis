import type messages from "@/messages/en.json";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";

type Messages = typeof messages;

/**
 * The site's navigation, as drawn in Stitch (design/HANDOFF.md §0 and §6,
 * design/stitch/prompts/00-shell-v2.md), filtered to the pages that exist.
 *
 * "Nothing looks live that isn't": a link to a page that isn't built yet is
 * left out, so the shell never shows a dead link. When a slice ships one of
 * these pages, add its route to BUILT_ROUTES (and to the allow-list in
 * test/site-shell.test.tsx) and the link appears in the header and footer.
 */
export const BUILT_ROUTES = ["/", SIGN_IN_PATH, SIGN_UP_PATH, AFTER_AUTH_PATH] as const;

export function isBuiltRoute(href: string): boolean {
  const path = href.split(/[?#]/)[0];
  return (BUILT_ROUTES as readonly string[]).includes(path);
}

/** A destination: `key` names its label in messages/en.json `Links`. */
type NavLink = { readonly key: keyof Messages["Links"]; readonly href: string };

export function builtOnly<T extends { href: string }>(items: readonly T[]): T[] {
  return items.filter((item) => isBuiltRoute(item.href));
}

/** Header nav: EVIDENCE · TRADES · TELEMETRY · COMPANY ▾ (DESIGN.md IA). Labels under Links. */
export const HEADER_NAV = [
  { key: "evidence", href: "/evidence" },
  { key: "trades", href: "/trades" },
  { key: "telemetry", href: "/telemetry" },
] as const satisfies readonly NavLink[];

/** COMPANY ▾ opens About and Contact us. */
export const COMPANY_NAV = [
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const satisfies readonly NavLink[];

/** Footer CTAs under "Show your work." Labels under Links. */
export const FOOTER_CTAS = [
  { key: "joinAsFundi", href: SIGN_UP_PATH, primary: true },
  { key: "findFundi", href: "/fundis", primary: false },
] as const satisfies readonly (NavLink & { primary: boolean })[];

/** Footer link groups from 00-shell-v2.md. Group labels under Footer.groups, link labels under Links. */
export const FOOTER_GROUPS = [
  {
    key: "forFundis",
    links: [
      { key: "joinAsFundi", href: SIGN_UP_PATH },
      { key: "howVerificationWorks", href: "/evidence" },
      { key: "privacy", href: "/privacy" },
    ],
  },
  {
    key: "forClients",
    links: [
      { key: "findFundi", href: "/fundis" },
      { key: "verifiedMeans", href: "/evidence#scope" },
    ],
  },
  {
    key: "forExperts",
    links: [{ key: "becomeVerifier", href: "/experts" }],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "contact", href: "/contact" },
      { key: "responsibleAi", href: "/telemetry" },
      { key: "roadmap", href: "/roadmap" },
    ],
  },
] as const satisfies readonly { key: keyof Messages["Footer"]["groups"]; links: readonly NavLink[] }[];
