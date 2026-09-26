import { SiteFooter } from "@/components/site-footer";

/** Every page outside the auth screens ends with the full site footer (#27). */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
