import { SlimFooter } from "@/components/slim-footer";

/**
 * The auth screens (Stitch 07-09: sign-in, sign-up, signed-out) end with
 * the legal line only. A route-group layout, so no client JS decides it.
 */
export default function AuthGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SlimFooter />
    </>
  );
}
