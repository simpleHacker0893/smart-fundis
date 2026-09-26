import { TRADE_ROWS, type TradeCatalogueEntry } from "./tradeCatalogue";
import type { RubricItem } from "./validators";

// The Tasks and Rubrics that seed.trades writes (#37). Server and seed only:
// the web and lib/fundiProfile.ts import lib/tradeCatalogue.ts instead, so the
// Rubric item text never reaches the client bundle.

export type TaskSeed = { slug: string; name: string; version: number; items: RubricItem[] };

export type TradeSeed = TradeCatalogueEntry & {
  /** Only a Trade with a Task has a Rubric, and so "Verify now". */
  task?: TaskSeed;
};

/**
 * The Task of each Trade that has one, keyed by Trade slug.
 *
 * Only Electrical and Hairdressing have a Task and Rubric (US-3.2), so only
 * they are "Verify now". The rest can be declared on a profile but cannot
 * earn a Badge yet. The Rubric `text` is English, is what the AI receives,
 * and must be read by rai-reviewer before it ships.
 * A Rubric version that an Assessment references is frozen: to change it, add
 * a new version here and move `activeRubricId`. seed.trades enforces this (it
 * throws), and rewrites a stored version in place only while no Assessment
 * references it, which is how the rai-reviewer edits to v1 reach dev.
 */
export const TRADE_TASKS: Readonly<Record<string, TaskSeed>> = {
  electrical: {
    slug: "13a-socket",
    name: "Install a 13A socket",
    version: 1,
    items: [
      {
        id: "isolate",
        text: "Shows the breaker being switched off on camera before touching any wires.",
        safety: true,
      },
      {
        id: "test_dead",
        text: "Holds the voltage tester to each wire on camera so its reading or light shows the power is off.",
        safety: true,
      },
      {
        id: "terminals",
        text: "Holds each wire to the camera and connects it to the right terminal: brown (or old red) to L, blue (or old black) to N.",
        safety: true,
      },
      {
        id: "earth",
        text: "Connects the green-and-yellow earth wire to the earth terminal (E). On older installs, the bare earth wire is covered in green-and-yellow sleeving.",
        safety: true,
      },
      {
        id: "no_bare_copper",
        text: "Tightens every terminal screw and gives each wire a light pull to show it is firm. No bare copper shows outside the terminals.",
        safety: true,
      },
      {
        id: "faceplate",
        text: "Fixes the faceplate to the box straight and level, with no wires trapped.",
        safety: false,
      },
      {
        id: "function_test",
        text: "Switches the power back on and shows the socket works, with a socket tester or a plugged-in device.",
        safety: false,
      },
    ],
  },
  hairdressing: {
    slug: "cornrows",
    name: "Cornrows",
    version: 1,
    items: [
      {
        id: "prep",
        text: "Detangles and sections the hair before braiding.",
        safety: false,
      },
      {
        id: "tool_hygiene",
        text: "Shows the comb and clips are clean before starting, and does not reuse a tool dropped on the floor.",
        safety: true,
      },
      {
        id: "parting",
        text: "Makes clean, even parts that follow the planned pattern (straight or curved).",
        safety: false,
      },
      {
        id: "tension",
        text: "Braids firmly but not too tight: the skin at the hairline and roots is not pulled up or stretched, and no raised bumps appear.",
        safety: true,
      },
      {
        id: "even_braids",
        text: "Keeps each braid the size planned for the style, neat from root to end.",
        safety: false,
      },
      {
        id: "neat_ends",
        text: "Finishes the ends neatly so the braids do not come loose.",
        safety: false,
      },
    ],
  },
};

/**
 * All 62 Trades (lib/tradeCatalogue.ts, in catalogue order), each with its
 * Task when it has one. Convex keeps English names only; the names and
 * descriptions the user sees live in next-intl, keyed by slug.
 */
export const TRADE_CATALOGUE: readonly TradeSeed[] = TRADE_ROWS.map((row) => {
  const task = TRADE_TASKS[row.slug];
  return task === undefined ? row : { ...row, task };
});
