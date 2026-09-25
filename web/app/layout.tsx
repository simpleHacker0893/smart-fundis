import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { SiteHeader } from "@/components/site-header";
import { defaultLocale } from "@/i18n/config";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { AFTER_AUTH_PATH, SIGN_IN_PATH, SIGN_UP_PATH, SIGNED_OUT_PATH } from "@/lib/auth-routes";
import "./globals.css";

// Display and body (DESIGN.md L80): the system stack first, Inter where the
// system has none. Readouts: JetBrains Mono (L83). globals.css maps both
// into --font-sans / --font-mono.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  // Must equal --bg in globals.css: a <meta> tag can't read CSS variables.
  // test/root-layout.test.tsx checks that the two match.
  themeColor: "#050609",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Dark only (D-9): the Instrument tokens live in :root, and `dark` turns
    // on shadcn's dark: variants.
    <html
      lang={defaultLocale}
      className={`dark ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Clerk docs: ClerkProvider goes inside <body>. Convex docs: the
            Convex provider (ConvexProviderWithClerk) sits inside it. */}
        <ClerkProvider
          signInUrl={SIGN_IN_PATH}
          signUpUrl={SIGN_UP_PATH}
          signInFallbackRedirectUrl={AFTER_AUTH_PATH}
          signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
          afterSignOutUrl={SIGNED_OUT_PATH}
          appearance={clerkAppearance}
        >
          <ConvexClientProvider>
            <NextIntlClientProvider>
              <SiteHeader />
              {/* The skip link's target; the scroll margin clears the sticky header (92 px mobile, 72 px desktop). */}
              <div
                id="main-content"
                tabIndex={-1}
                className="flex flex-1 scroll-mt-24 flex-col outline-none lg:scroll-mt-[72px]"
              >
                {children}
              </div>
            </NextIntlClientProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
