import type { ReactNode } from "react";
import { SectionLabel } from "@/components/landing/section";

/**
 * The Stitch auth screens' layout (07 sign-in, 08 join): a photo panel and a
 * session panel, stacked on mobile (session first) and side by side from
 * 1024 px. The session panel carries the page heading above Clerk's widget.
 */
export function AuthLayout({
  label,
  title,
  body,
  widget,
  aside,
  after,
}: {
  label: string;
  title: string;
  body: string;
  widget: ReactNode;
  aside: ReactNode;
  after?: ReactNode;
}) {
  return (
    <main className="flex w-full flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-16">
        <section className="flex flex-col lg:order-2">
          <div className="mx-auto flex w-full max-w-md flex-col gap-5">
            <div>
              <SectionLabel>{label}</SectionLabel>
              <h1 className="mb-2 text-4xl font-black tracking-tight">{title}</h1>
              <p className="text-sm text-foreground/75">{body}</p>
            </div>
            {widget}
            {after}
          </div>
        </section>
        <aside className="lg:order-1">{aside}</aside>
      </div>
    </main>
  );
}
