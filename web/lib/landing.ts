/**
 * Data for the landing page's example inspection (Electrical · Install a
 * 13A socket), from prompt 01-landing.md and the Stitch step inspector.
 * Copy lives in messages/en.json `Landing.steps.<id>`; this file holds only
 * what isn't copy: the order, the verdict and where the reticle sits on the
 * photo (percent of the frame).
 */
export type StepId = "1" | "2" | "3" | "4";
export type Verdict = "observed" | "review";

export type InspectionStep = {
  id: StepId;
  /** "01" … "04", for the counters. */
  number: string;
  verdict: Verdict;
  reticle: { top: string; left: string; width: string; height: string };
};

export const STEPS: readonly InspectionStep[] = [
  { id: "1", number: "01", verdict: "observed", reticle: { top: "14%", left: "22%", width: "28%", height: "30%" } },
  { id: "2", number: "02", verdict: "observed", reticle: { top: "26%", left: "58%", width: "25%", height: "34%" } },
  // Step 03 is the safety step the AI couldn't read, so it waits for an Expert (ADR-11).
  { id: "3", number: "03", verdict: "review", reticle: { top: "31%", left: "63%", width: "22%", height: "32%" } },
  { id: "4", number: "04", verdict: "observed", reticle: { top: "44%", left: "44%", width: "26%", height: "28%" } },
];

/** The Stitch screen opens on the step that needs review. */
export const INITIAL_STEP: StepId = "3";

export const LIVE_TRADES = ["electrical", "hairdressing"] as const;

export const BENCH_TRADES = [
  "plumbing",
  "masonry",
  "carpentry",
  "welding",
  "mechanic",
  "tailoring",
  "beauty",
  "solar",
  "mamaFua",
  "movers",
] as const;

export const SCOPE_CHECKS = ["app", "code", "ai", "safety", "expert"] as const;
export const SCOPE_NOT_CHECKED = ["id", "licences", "qualifications"] as const;
export const BADGE_LAYERS = ["video", "code", "aiCheck", "expert"] as const;
export const NEXT_CARDS = ["coop", "bookings", "pro", "training"] as const;
