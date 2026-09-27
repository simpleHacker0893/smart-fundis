import { SiteHeader } from "@/components/site-header";

/**
 * The marketing chrome shared by the (site) and (auth) route groups: the
 * sticky site header and the skip link's target. Role routes use the app
 * shell instead (#67), so it lives in the group layouts, not the root.
 */
export function SiteChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      {/* The skip link's target; the scroll margin clears the sticky header (92 px mobile, 72 px desktop). */}
      <div id="main-content" tabIndex={-1} className="flex flex-1 scroll-mt-24 flex-col outline-none lg:scroll-mt-[72px]">
        {children}
      </div>
    </>
  );
}
