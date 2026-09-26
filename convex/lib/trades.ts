import type { RubricItem, TradeCategory } from "./validators";

// The Trade catalogue that seed.trades writes and trades.list orders by (#37).

export type TaskSeed = { slug: string; name: string; version: number; items: RubricItem[] };

export type TradeSeed = {
  slug: string;
  name: string;
  category: TradeCategory;
  /** Only a Trade with a Task has a Rubric, and so "Verify now". */
  task?: TaskSeed;
  /**
   * The regulator whose licence or registration the catalogue says this Trade
   * needs ("Yes" or a named regulator in the Licence column). Code only, not
   * stored: nothing checks it yet.
   */
  licence?: TradeLicence;
};

/**
 * EPRA: electrical worker / solar PV licence. NCA: construction worker
 * accreditation. PCPB: pest control registration. NTSA: driving licence.
 */
export type TradeLicence = "EPRA" | "NCA" | "PCPB" | "NTSA";

/**
 * All 62 Trades of the operator-approved catalogue
 * (docs/research/2026-09-26-kenya-trades-catalogue.md), in its row order
 * (#1..#62). Slug, English `name` and `category` match the table exactly.
 * Convex keeps English names only; the EN and SW names and descriptions the
 * user sees live in next-intl, keyed by slug (see TRADE_SLUGS).
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
export const TRADE_CATALOGUE: readonly TradeSeed[] = [
  {
    slug: "electrical",
    name: "Electrical",
    category: "skilled",
    licence: "EPRA",
    task: {
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
  },
  {
    slug: "hairdressing",
    name: "Hairdressing",
    category: "skilled",
    task: {
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
  },
  { slug: "plumbing", name: "Plumbing", category: "skilled", licence: "NCA" },
  { slug: "masonry", name: "Masonry", category: "skilled", licence: "NCA" },
  { slug: "carpentry", name: "Carpentry", category: "skilled", licence: "NCA" },
  { slug: "welding", name: "Welding", category: "skilled" },
  { slug: "mechanic", name: "Mechanic", category: "skilled" },
  { slug: "tailoring", name: "Tailoring", category: "skilled" },
  { slug: "beauty", name: "Beauty", category: "skilled" },
  { slug: "solar", name: "Solar installation", category: "skilled", licence: "EPRA" },
  { slug: "mamaFua", name: "Mama fua (laundry)", category: "odd_job" },
  { slug: "movers", name: "Movers", category: "odd_job" },
  { slug: "painting", name: "Painting & decorating", category: "skilled", licence: "NCA" },
  { slug: "tiling", name: "Tiling & terrazzo", category: "skilled", licence: "NCA" },
  { slug: "roofing", name: "Roofing", category: "skilled", licence: "NCA" },
  { slug: "steelFixing", name: "Steel fixing", category: "skilled", licence: "NCA" },
  { slug: "glazing", name: "Glass & aluminium", category: "skilled", licence: "NCA" },
  { slug: "gypsum", name: "Gypsum & ceilings", category: "skilled", licence: "NCA" },
  { slug: "constructionHelper", name: "Site helper (mjengo)", category: "odd_job" },
  { slug: "paving", name: "Cabro & paving", category: "semi_skilled", licence: "NCA" },
  { slug: "signWriting", name: "Sign writing", category: "skilled" },
  { slug: "furnitureMaking", name: "Furniture making", category: "skilled" },
  { slug: "upholstery", name: "Upholstery", category: "skilled" },
  { slug: "woodCarving", name: "Wood carving", category: "skilled" },
  { slug: "interiorDecor", name: "Curtains & interior decor", category: "semi_skilled" },
  { slug: "landscaping", name: "Landscaping & gardening", category: "semi_skilled" },
  { slug: "cleaning", name: "Cleaning", category: "odd_job" },
  { slug: "cooking", name: "Cooking & catering", category: "skilled" },
  { slug: "baking", name: "Baking & cakes", category: "skilled" },
  { slug: "shoeRepair", name: "Shoe repair & making", category: "skilled" },
  { slug: "leatherwork", name: "Leatherwork", category: "skilled" },
  { slug: "motorcycleRepair", name: "Motorcycle (boda) repair", category: "skilled" },
  { slug: "autoElectrical", name: "Auto electrical", category: "skilled" },
  { slug: "panelBeating", name: "Panel beating", category: "skilled" },
  { slug: "sprayPainting", name: "Spray painting", category: "skilled" },
  { slug: "tyreRepair", name: "Tyre repair", category: "semi_skilled" },
  { slug: "carWash", name: "Car wash & detailing", category: "odd_job" },
  { slug: "refrigerationAc", name: "Fridge & AC repair", category: "skilled" },
  { slug: "phoneRepair", name: "Phone repair", category: "skilled" },
  { slug: "electronicsRepair", name: "Electronics & appliance repair", category: "skilled" },
  { slug: "computerRepair", name: "Computer repair", category: "skilled" },
  { slug: "cctvSecurity", name: "CCTV & security systems", category: "skilled" },
  { slug: "satelliteTv", name: "TV dish & internet installation", category: "semi_skilled" },
  { slug: "pumpRepair", name: "Water pump & borehole repair", category: "skilled" },
  { slug: "motorRewinding", name: "Motor rewinding", category: "skilled" },
  { slug: "generatorRepair", name: "Generator repair", category: "skilled" },
  { slug: "pestControl", name: "Fumigation & pest control", category: "semi_skilled", licence: "PCPB" },
  { slug: "barbering", name: "Barbering", category: "skilled" },
  { slug: "nails", name: "Nail technician", category: "skilled" },
  { slug: "makeup", name: "Make-up artist", category: "skilled" },
  { slug: "knitting", name: "Knitting & crochet", category: "skilled" },
  { slug: "weaving", name: "Weaving & basketry", category: "skilled" },
  { slug: "beadwork", name: "Jewellery & beadwork", category: "skilled" },
  { slug: "metalwork", name: "Jua kali metalwork", category: "skilled" },
  { slug: "textileDecoration", name: "Embroidery, batik & tie-dye", category: "skilled" },
  { slug: "printing", name: "Printing & branding", category: "semi_skilled" },
  { slug: "photography", name: "Photography & video", category: "skilled" },
  { slug: "eventDecor", name: "Event decor & tents", category: "semi_skilled" },
  { slug: "driving", name: "Driver", category: "semi_skilled", licence: "NTSA" },
  { slug: "locksmith", name: "Locksmith & key cutting", category: "semi_skilled" },
  { slug: "farmHand", name: "Farm work (shamba)", category: "odd_job" },
  { slug: "bicycleRepair", name: "Bicycle repair", category: "semi_skilled" },
];

/**
 * Every catalogue slug, in catalogue order. The web imports it to check that
 * next-intl has an EN and SW name and description for each Trade.
 */
export const TRADE_SLUGS: readonly string[] = TRADE_CATALOGUE.map((trade) => trade.slug);

/** Slug -> regulator, for the Trades that need a licence. */
export const TRADE_LICENCE: Readonly<Record<string, TradeLicence>> = Object.fromEntries(
  TRADE_CATALOGUE.flatMap((trade) => (trade.licence === undefined ? [] : [[trade.slug, trade.licence]])),
);

const ORDER = new Map(TRADE_SLUGS.map((slug, i) => [slug, i]));

/** Where each seeded Trade sits in trades.list (catalogue order); unknown slugs go last. */
export function tradeOrder(slug: string): number {
  return ORDER.get(slug) ?? TRADE_CATALOGUE.length;
}
