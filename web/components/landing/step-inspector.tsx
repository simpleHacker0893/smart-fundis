"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  createContext,
  use,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { INITIAL_STEP, STEPS, type StepId, type Verdict } from "@/lib/landing";

type StepState = { step: StepId; setStep: (step: StepId) => void };

const StepContext = createContext<StepState | null>(null);

function useStep(): StepState {
  const value = use(StepContext);
  if (!value) throw new Error("useStep must be used inside <StepProvider>");
  return value;
}

/**
 * Shares the chosen step between the hero inspector (Section 01) and the
 * ledger (Section 04), as the Stitch screen's script does. Everything between
 * them stays a server component.
 */
export function StepProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<StepId>(INITIAL_STEP);
  return <StepContext value={{ step, setStep }}>{children}</StepContext>;
}

function VerdictGlyph({ verdict }: { verdict: Verdict }) {
  const glyphs = useTranslations("Glyphs");
  // ✓ is white and ◐ is amber: status is never colour alone (DESIGN.md L78).
  return (
    <span aria-hidden="true" className={verdict === "review" ? "text-amber" : "text-foreground"}>
      {verdict === "review" ? glyphs("review") : glyphs("pass")}
    </span>
  );
}

/**
 * The Stitch step inspector: four step tabs drive a reticle on the evidence
 * frame, its markers and the caption. Tabs follow the ARIA tabs pattern
 * (arrow keys, Home, End). Motion (scan line, ping, reticle glide) runs only
 * when the visitor allows it.
 */
export function StepInspector({ imageSrc }: { imageSrc: string }) {
  const t = useTranslations("Landing");
  const glyphs = useTranslations("Glyphs");
  const { step, setStep } = useStep();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = STEPS.find((s) => s.id === step)!;
  const isReview = current.verdict === "review";
  const tabId = (id: StepId) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = STEPS.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setStep(STEPS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-2 font-mono text-xs tracking-widest text-foreground/75 uppercase">
          <span aria-hidden="true" className="size-2 rounded-full bg-amber motion-safe:animate-ping" />
          {t("inspector.label")}
        </span>
        <span className="font-mono text-xs font-bold text-amber uppercase" aria-live="polite">
          {t("inspector.counter", { step: current.number })}
        </span>
      </div>

      <div role="tablist" aria-label={t("inspector.stepsLabel")} className="mb-3 grid grid-cols-4 gap-2">
        {STEPS.map((s, index) => {
          const selected = s.id === step;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={tabId(s.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setStep(s.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`flex min-h-12 flex-col justify-between rounded border px-2 py-2.5 text-left transition-colors ${
                selected ? "border-2 border-amber bg-panel" : "border-line bg-panel hover:border-foreground/30"
              }`}
            >
              <span className="flex w-full items-center justify-between font-mono text-xs">
                <span className={`font-bold ${selected ? "text-amber" : "text-foreground/75"}`}>{s.number}</span>
                <span className="hidden text-foreground/75 sm:inline">{t(`steps.${s.id}.time`)}</span>
              </span>
              <span className="mt-1 truncate font-mono text-xs font-medium uppercase">{t(`steps.${s.id}.short`)}</span>
              <span className="mt-1.5 flex items-center gap-1 font-mono text-xs uppercase">
                <VerdictGlyph verdict={s.verdict} />
                <span className="sr-only truncate text-foreground/75 sm:not-sr-only">
                  {t(`status.${s.verdict}`)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(step)}
        className="relative flex flex-col overflow-hidden rounded border border-line bg-panel p-2 sm:p-3"
      >
        <div className="mb-2 flex items-center justify-between border-b border-line px-2 py-1.5 font-mono text-xs text-foreground/75 uppercase">
          <span>{t("inspector.frame")}</span>
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-amber">
            <span aria-hidden="true" className="size-2 rounded-full bg-amber motion-safe:animate-pulse" />
            {t("inspector.frameStatus", { step: current.number })}
          </span>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded bg-background">
          <Image
            src={imageSrc}
            alt={t("hero.imageAlt")}
            fill
            priority
            sizes="(min-width: 1280px) 700px, (min-width: 1024px) 56vw, 100vw"
            className="object-cover opacity-90 contrast-125 grayscale"
          />
          {/* Decorative overlays: never block taps (DESIGN.md L109). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 hidden h-0.5 bg-gradient-to-r from-transparent via-amber to-transparent motion-safe:block motion-safe:animate-scan"
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 border-2 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out ${
              isReview ? "border-amber" : "border-foreground"
            }`}
            style={current.reticle}
          >
            <span className="absolute inset-0 flex items-center justify-center">
              <span className={`size-2.5 rounded-full motion-safe:animate-ping ${isReview ? "bg-amber/70" : "bg-foreground/70"}`} />
            </span>
          </div>
          <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded border border-line bg-background/90 px-2.5 py-1 font-mono text-xs tracking-wider uppercase">
            <span aria-hidden="true" className="text-amber">
              {glyphs("step")}
            </span>
            <span>
              {t("inspector.marker", {
                number: current.number,
                name: t(`steps.${step}.name`),
                time: t(`steps.${step}.time`),
              })}
            </span>
          </div>
          <div
            className={`pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-2 rounded border bg-background/90 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider uppercase ${
              isReview ? "border-amber/70 text-amber" : "border-line text-foreground"
            }`}
          >
            <VerdictGlyph verdict={current.verdict} />
            <span>{t(`steps.${step}.readout`)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded border border-line bg-background/60 p-3">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden="true">{glyphs("pass")}</span>
              {t("inspector.verified")}
            </span>
            <span className="mt-0.5 truncate font-mono text-xs tracking-wider text-foreground/75 uppercase">
              {t("inspector.caption", { step: current.number })}
            </span>
          </div>
          <span className="shrink-0 rounded border border-foreground/20 px-3 py-1 font-mono text-xs tracking-widest text-foreground/75 uppercase">
            {t("inspector.example")}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Section 04's instrument ledger. The row for the step chosen in the hero
 * inspector is marked (aria-current="step"), as the Stitch script does.
 */
export function Ledger() {
  const t = useTranslations("Landing");
  const glyphs = useTranslations("Glyphs");
  const { step } = useStep();

  return (
    <div className="overflow-hidden rounded border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
          {t("inspector.ledgerCaption")}
        </span>
        <span className="rounded border border-foreground/20 px-3 py-1 font-mono text-xs tracking-widest text-foreground/75 uppercase">
          {t("inspector.example")}
        </span>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="font-mono text-xs tracking-widest text-foreground/75 uppercase">
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-3 font-medium">{t("decide.colStep")}</th>
            <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">{t("decide.colObservation")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("decide.colTime")}</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">{t("decide.colStatus")}</th>
          </tr>
        </thead>
        <tbody>
          {STEPS.map((s) => {
            const selected = s.id === step;
            return (
              <tr
                key={s.id}
                aria-current={selected ? "step" : undefined}
                className={`border-b border-line border-l-2 ${selected ? "border-l-amber bg-foreground/5" : "border-l-transparent"}`}
              >
                <th scope="row" className="px-4 py-3 font-medium">{t(`steps.${s.id}.name`)}</th>
                <td className="hidden px-4 py-3 font-mono text-xs text-foreground/75 md:table-cell">
                  {t(`decide.observations.${s.id}`)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground/75">{t(`steps.${s.id}.time`)}</td>
                <td
                  className={`px-4 py-3 text-right font-mono text-xs whitespace-nowrap ${s.verdict === "review" ? "text-amber" : ""}`}
                >
                  <VerdictGlyph verdict={s.verdict} /> {t(`status.${s.verdict}`)}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-line bg-background/60">
            <th scope="row" className="px-4 py-4 font-mono text-xs font-bold tracking-widest uppercase">
              {t("decide.expert")}
            </th>
            <td className="hidden px-4 py-4 font-mono text-xs text-foreground/75 md:table-cell">
              {t("decide.expertNote")}
            </td>
            <td className="px-4 py-4 font-mono text-xs text-foreground/75">{t("decide.noTime")}</td>
            <td className="px-4 py-4 text-right font-mono text-xs font-bold whitespace-nowrap">
              <span aria-hidden="true">{glyphs("pass")}</span> {t("decide.badgeIssued")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
