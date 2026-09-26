import type { TradeCategory } from "./validators";

// The Rubric-free Trade catalogue (#37): slug, name, category and licence
// only. The web imports this file, and so does lib/fundiProfile.ts, so it
// must never import lib/trades.ts, which holds the Tasks and the Rubric item
// text that only the seed (and the AI) needs.

/**
 * EPRA: electrical worker / solar PV licence. NCA: construction worker
 * accreditation. PCPB: pest control registration. NTSA: driving licence.
 */
export type TradeLicence = "EPRA" | "NCA" | "PCPB" | "NTSA";

export type TradeCatalogueEntry = {
  slug: string;
  name: string;
  category: TradeCategory;
  /**
   * The regulator whose licence or registration the catalogue says this Trade
   * needs ("Yes" or a named regulator in the Licence column). Code only, not
   * stored: nothing checks it yet.
   */
  licence?: TradeLicence;
};

/**
 * All 62 Trades of the operator-approved catalogue
 * (docs/research/2026-09-26-kenya-trades-catalogue.md), in its row order
 * (#1..#62). Slug, English `name` and `category` match the table exactly.
 * lib/trades.ts adds the Task and Rubric of the Trades that have one.
 */
export const TRADE_ROWS: readonly TradeCatalogueEntry[] = [
  { slug: "electrical", name: "Electrical", category: "skilled", licence: "EPRA" },
  { slug: "hairdressing", name: "Hairdressing", category: "skilled" },
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

/** How many Trades the catalogue has (62). */
export const TRADE_COUNT: number = TRADE_ROWS.length;

/**
 * Every catalogue slug, in catalogue order. The web imports it to check that
 * next-intl has a name and description for each Trade (English only, D-64).
 */
export const TRADE_SLUGS: readonly string[] = TRADE_ROWS.map((trade) => trade.slug);

/** Slug -> regulator, for the Trades that need a licence. */
export const TRADE_LICENCE: Readonly<Record<string, TradeLicence>> = Object.fromEntries(
  TRADE_ROWS.flatMap((trade) => (trade.licence === undefined ? [] : [[trade.slug, trade.licence]])),
);

const ORDER = new Map(TRADE_SLUGS.map((slug, i) => [slug, i]));

/** Where each seeded Trade sits in trades.list (catalogue order); unknown slugs go last. */
export function tradeOrder(slug: string): number {
  return ORDER.get(slug) ?? TRADE_COUNT;
}
