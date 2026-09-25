import Image from "next/image";
import { Reticles } from "@/components/landing/reticles";

/**
 * A static evidence frame (DESIGN.md "one signature idea"): a panel with a
 * mono meta row, a grayscale photo with a scan line, corner reticles and
 * diamond step markers. The photo is the only place photos appear.
 */
export function EvidenceFrame({
  label,
  tag,
  src,
  alt,
  markers = [],
  priority = false,
  aspect = "aspect-[4/3]",
  sizes = "(min-width: 1024px) 640px, 100vw",
}: {
  label: string;
  tag: string;
  src: string;
  alt: string;
  markers?: string[];
  priority?: boolean;
  aspect?: string;
  sizes?: string;
}) {
  return (
    <figure className="rounded border border-line bg-panel p-2 sm:p-3">
      <figcaption className="mb-2 flex items-center justify-between gap-3 border-b border-line px-2 py-1.5 font-mono text-xs tracking-wider text-foreground/75 uppercase">
        <span>{label}</span>
        <span className="text-amber">{tag}</span>
      </figcaption>
      <div className={`relative w-full overflow-hidden rounded bg-background ${aspect}`}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover opacity-90 contrast-125 grayscale" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 hidden h-0.5 bg-gradient-to-r from-transparent via-amber to-transparent motion-safe:block motion-safe:animate-scan"
        />
        <Reticles />
        {markers.length > 0 && (
          <ol className="pointer-events-none absolute inset-x-5 bottom-5 flex flex-col items-start gap-1.5">
            {markers.map((marker) => (
              <li
                key={marker}
                className="flex items-center gap-2 rounded border border-line bg-background/90 px-2.5 py-1 font-mono text-xs tracking-wider uppercase"
              >
                <span aria-hidden="true" className="size-2 rotate-45 border border-amber bg-amber" />
                {marker}
              </li>
            ))}
          </ol>
        )}
      </div>
    </figure>
  );
}
