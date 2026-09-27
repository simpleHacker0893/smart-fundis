import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { PublicProfile } from "./public-profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PublicProfile");
  return {
    title: t("meta.title"),
    // RAI (#42): profiles are public by default and there is no visibility
    // toggle until V3, so keep them out of search engines until it ships.
    robots: { index: false, follow: false },
  };
}

const MAIN = "mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12";

/**
 * /f/<fundiProfileId> (#42, US-5.7): a Fundi's public profile. Public by
 * design (not a protected prefix in lib/auth-routes.ts): a Client opens it
 * without signing in, and fundiProfiles.getPublic reads no identity.
 *
 * The profile is loaded on the server so a missing, hidden or malformed id
 * is a real 404 (notFound() only works in Server Components); getPublic
 * returns null for all three and never throws on a bad id. The preloaded
 * result then stays live on the client, so a new Badge appears without a
 * reload. Unstyled for V1; Stitch styling comes later.
 */
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // A build with no Convex URL (no root .env) has no deployment to read.
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    const t = await getTranslations("PublicProfile");
    return (
      <main className={MAIN}>
        <p className="text-base text-foreground/75">{t("unavailable")}</p>
      </main>
    );
  }

  const preloaded = await preloadQuery(api.fundiProfiles.getPublic, { id });
  if (preloadedQueryResult(preloaded) === null) notFound();

  return (
    <main className={MAIN}>
      <PublicProfile preloaded={preloaded} />
    </main>
  );
}
