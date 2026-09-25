import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { SignedInAs } from "./signed-in-as";

// Guarded here as well as in the proxy (D-15). The email comes from Convex
// `users.me` on the client; the Clerk email from the server is shown until
// then. Routing by role (spec §4) arrives with the roles in V1.
export default async function DashboardPage() {
  await auth.protect();
  const [t, user] = await Promise.all([
    getTranslations("DashboardPage"),
    currentUser(),
  ]);
  const fallbackEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <SignedInAs fallbackEmail={fallbackEmail} />
    </main>
  );
}
