"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { COMPANY_NAV } from "@/lib/site-nav";

/**
 * COMPANY ▾: a disclosure that opens About and Contact us (#24), in the
 * desktop nav and in the mobile nav row. It follows the WAI disclosure
 * pattern: a button with aria-expanded and aria-controls. Escape or a click
 * outside closes it and Escape returns focus to the button. The panel is
 * always in the markup (hidden when closed), so its links work without JS.
 */
export function CompanyMenu({ className, variant }: { className: string; variant: "desktop" | "row" }) {
  const links = useTranslations("Links");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className={variant === "desktop" ? "relative" : "static"}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`${className} w-full gap-1`}
      >
        {links("company")}
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={
          variant === "desktop"
            ? "absolute top-full right-0 z-50 mt-1 w-48 rounded border border-line bg-panel p-1"
            : "absolute inset-x-0 top-full z-50 border-b border-line bg-panel px-4 py-1"
        }
      >
        {COMPANY_NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center rounded px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            {links(item.key)}
          </Link>
        ))}
      </div>
    </div>
  );
}
