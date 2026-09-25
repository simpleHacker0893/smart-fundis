import Link from "next/link";
import { useTranslations } from "next-intl";
import { pillClass } from "@/components/ui/pill";
import { builtOnly, PRIMARY_CTAS } from "@/lib/site-nav";

/**
 * The hero call-to-action pair (#24 review): the amber "Join as a fundi"
 * pill, then the secondary pill. A CTA whose page doesn't exist yet is left
 * out, so "Find a fundi" waits for /fundis (#13 review).
 */
export function HeroCtas({ className = "max-w-md" }: { className?: string }) {
  const links = useTranslations("Links");

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:gap-4 ${className}`}>
      {builtOnly(PRIMARY_CTAS).map((cta) => (
        <Link
          key={cta.key}
          href={cta.href}
          className={pillClass({
            variant: cta.primary ? "primary" : "secondary",
            size: "full",
            className: cta.primary ? "sm:w-auto" : "bg-panel sm:w-auto",
          })}
        >
          {links(cta.key)}
        </Link>
      ))}
    </div>
  );
}
