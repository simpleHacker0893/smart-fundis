import type messages from "@/messages/en.json";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH, SIGNED_OUT_PATH } from "@/lib/auth-routes";

type Messages = typeof messages;

/**
 * The site's navigation, from the Stitch landing screen
 * (design/stitch/exports/01-landing-v3-responsive.html).
 *
 * "Nothing looks live that isn't": a destination is either a page that
 * exists (BUILT_ROUTES) or a section of the landing page ("/#id"). Links to
 * pages that don't exist yet (/privacy, /experts, /about, /contact) stay in
 * the lists below but are filtered out by builtOnly(). When a slice ships
 * one of those pages, add its route to BUILT_ROUTES (and to the allow-list in
 * test/site-shell.test.tsx) and the link appears.
 */
export const BUILT_ROUTES = ["/", SIGN_IN_PATH, SIGN_UP_PATH, AFTER_AUTH_PATH, "/evidence", "/trades", "/telemetry", "/about", "/contact", "/privacy", "/responsible-ai", SIGNED_OUT_PATH, "/join"] as const;

/** Join links carry the role; /join redirects fundis to sign-up (#27). */
export const JOIN_FUNDI_PATH = "/join?role=fundi";
export const JOIN_EXPERT_PATH = "/join?role=expert";

export function isBuiltRoute(href: string): boolean {
  if (href.startsWith("#")) return true;
  const path = href.split(/[?#]/)[0];
  return (BUILT_ROUTES as readonly string[]).includes(path);
}

/** A destination: `key` names its label in messages/en.json `Links`. */
type NavLink = { readonly key: keyof Messages["Links"]; readonly href: string };

export function builtOnly<T extends { href: string }>(items: readonly T[]): T[] {
  return items.filter((item) => isBuiltRoute(item.href));
}

/** Header nav: EVIDENCE · TRADES · TELEMETRY, then the COMPANY ▾ menu. */
export const SECTION_NAV = [
  { key: "evidence", href: "/evidence" },
  { key: "trades", href: "/trades" },
  { key: "telemetry", href: "/telemetry" },
] as const satisfies readonly NavLink[];

/** COMPANY ▾ opens About and Contact us (#24). */
export const COMPANY_NAV = [
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const satisfies readonly NavLink[];

/** "Show your work." CTAs: the primary pill, then the secondary. */
export const PRIMARY_CTAS = [
  { key: "joinAsFundi", href: JOIN_FUNDI_PATH, primary: true },
  // Operator: until /fundis exists, clients find fundis by trade on /trades.
  { key: "findFundi", href: "/trades", primary: false },
] as const satisfies readonly (NavLink & { primary: boolean })[];

/** The footer's four columns, in order (#27). Unbuilt pages are filtered out. */
export const FOOTER_GROUPS = [
  {
    key: "forFundis",
    links: [
      { key: "joinAsFundi", href: JOIN_FUNDI_PATH },
      { key: "howVerificationWorks", href: "/evidence" },
      { key: "privacy", href: "/privacy" },
    ],
  },
  {
    key: "forClients",
    links: [
      { key: "findFundis", href: "/trades" },
      { key: "verifiedMeans", href: "/evidence#scope" },
    ],
  },
  {
    key: "forExperts",
    links: [{ key: "becomeVerifier", href: JOIN_EXPERT_PATH }],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "contact", href: "/contact" },
      { key: "responsibleAi", href: "/responsible-ai" },
      { key: "roadmap", href: "/#roadmap" },
    ],
  },
] as const satisfies readonly { key: keyof Messages["Footer"]["groups"]; links: readonly NavLink[] }[];

