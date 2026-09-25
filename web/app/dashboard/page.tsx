import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";

// #4 swaps currentUser() for Convex users.me and routes by role (spec §4).
export default async function DashboardPage() {
  await auth.protect();
  const [t, user] = await Promise.all([
    getTranslations("DashboardPage"),
    currentUser(),
  ]);
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <main className="flex flex-1 flex-col justify-center gap-3 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-base text-muted-foreground">
        {email ? t("signedInAs", { email }) : t("signedIn")}
      </p>
    </main>
  );
}
