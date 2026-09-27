import { SiteChrome } from "@/components/site-chrome";
import { SiteFooter } from "@/components/site-footer";

/**
 * Every page outside the auth screens and the role routes: the site header
 * on top and the full site footer at the end (#27).
 */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SiteChrome>
      {children}
      <SiteFooter />
    </SiteChrome>
  );
}
