import { SiteChrome } from "@/components/site-chrome";
import { SlimFooter } from "@/components/slim-footer";

/**
 * The auth screens (Stitch 07-09: sign-in, sign-up, signed-out): the site
 * header on top, and the legal line only at the end. A route-group layout,
 * so no client JS decides it.
 */
export default function AuthGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SiteChrome>
      {children}
      <SlimFooter />
    </SiteChrome>
  );
}
