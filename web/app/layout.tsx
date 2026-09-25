import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { defaultLocale } from "@/i18n/config";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={defaultLocale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Clerk docs: ClerkProvider goes inside <body>. Convex docs: the
            Convex provider (ConvexProviderWithClerk) sits inside it. */}
        <ClerkProvider
          signInUrl={SIGN_IN_PATH}
          signUpUrl={SIGN_UP_PATH}
          signInFallbackRedirectUrl={AFTER_AUTH_PATH}
          signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
        >
          <ConvexClientProvider>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
