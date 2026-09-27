"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, type Ref, useCallback, useRef } from "react";
import { cn } from "cn";

/** Open and close a native <dialog> sheet. */
export function useSheet() {
  const ref = useRef<HTMLDialogElement>(null);
  const open = useCallback(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  const close = useCallback(() => {
    const dialog = ref.current;
    if (dialog?.open) dialog.close();
  }, []);
  return { ref, open, close };
}

/**
 * A sheet (D2): a bottom sheet on mobile with a decorative drag handle and a
 * 48 px Close button (dragging needs a non-drag alternative, WCAG 2.5.7);
 * `anchored` sheets become a popover under the header from 1024 px. Native
 * modal <dialog>: Esc, Close and a backdrop tap dismiss it, and focus
 * returns to the opener.
 */
export function Sheet({
  ref,
  title,
  anchored = false,
  children,
}: {
  ref: Ref<HTMLDialogElement>;
  title: string;
  anchored?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("AppShell");
  return (
    <dialog
      ref={ref}
      aria-label={title}
      // A tap on the backdrop lands on the <dialog> itself, never its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className={cn(
        "mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t border-t border-line bg-panel p-0 text-foreground backdrop:bg-black/70",
        "motion-safe:transition-transform motion-safe:duration-200",
        anchored && "lg:mt-[72px] lg:mr-8 lg:mb-auto lg:ml-auto lg:w-80 lg:rounded lg:border",
      )}
    >
      <div className="flex flex-col pb-[env(safe-area-inset-bottom)]">
        <span aria-hidden="true" className={cn("mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/20", anchored && "lg:hidden")} />
        <div className="flex items-center justify-between gap-4 pl-4">
          <h2 className="font-mono text-xs tracking-[0.26em] text-dim uppercase">
            {title}
          </h2>
          <button
            type="button"
            onClick={(event) => event.currentTarget.closest("dialog")?.close()}
            className="inline-flex min-h-12 items-center gap-2 px-4 font-mono text-xs tracking-[0.08em] text-foreground uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
            {t("sheet.close")}
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
