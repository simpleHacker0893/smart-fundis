"use client";

import { Plus } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { pillClass } from "@/components/ui/pill";
import { useShellSidebar } from "./shell-context";

/**
 * The role's one primary action at the top of the sidebar (D2): a full-width
 * flat amber pill, or a 48 px amber icon button on the collapsed rail (the
 * label stays its accessible name and its title tooltip). Pass one through
 * AppShell's `primaryAction` slot (the Fundi's Add video sheet trigger).
 */
function useLook(label: string) {
  const { collapsed } = useShellSidebar();
  return {
    className: collapsed
      ? "inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      : pillClass({ variant: "app-primary", size: "full", className: "px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" }),
    title: collapsed ? label : undefined,
    body: (icon: ReactNode) =>
      collapsed ? (
        <>
          {icon}
          <span className="sr-only">{label}</span>
        </>
      ) : (
        label
      ),
  };
}

const ICON = <Plus aria-hidden="true" className="size-5" strokeWidth={2} />;

export function PrimaryActionButton({
  label,
  icon = ICON,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & { label: string; icon?: ReactNode }) {
  const look = useLook(label);
  return (
    <button type="button" title={look.title} className={cn(look.className, className)} {...props}>
      {look.body(icon)}
    </button>
  );
}
