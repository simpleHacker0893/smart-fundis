import {
  BrickWall,
  Cog,
  Droplets,
  Flame,
  Hammer,
  Plug,
  Scissors,
  Shirt,
  Sparkles,
  Sun,
  Truck,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import type messages from "@/messages/en.json";
import { JOIN_FUNDI_PATH } from "@/lib/site-nav";

type Messages = typeof messages;
/** Every trade has a name in Landing.trades.names. */
export type TradeSlug = keyof Messages["Landing"]["trades"]["names"];
/** Open trades have a task, rubric and markers in Trades.open.<slug>. */
export type OpenTradeSlug = Extract<keyof Messages["Trades"]["open"], TradeSlug>;
type ImageAlt = keyof Messages["Trades"]["imageAlt"];

type TradeImage = { src: string; alt: ImageAlt };
export type OpenTrade = { open: true; slug: OpenTradeSlug; icon: LucideIcon; image: TradeImage };
export type BenchTrade = { open: false; slug: TradeSlug; icon: LucideIcon; image?: TradeImage };
export type Trade = OpenTrade | BenchTrade;

/**
 * The one list of trades (#25 review): which are open for verification,
 * their icon and their reviewed photo. The landing tiles, /trades, the
 * Responsible AI eval ledger and "Verify now" links all derive from it.
 * Mama fua and Movers have no matching photo, so they show their icon.
 */
export const TRADES: readonly Trade[] = [
  {
    open: true,
    slug: "electrical",
    icon: Plug,
    image: { src: "/images/landing-socket-wiring-1280.webp", alt: "electrical" },
  },
  {
    open: true,
    slug: "hairdressing",
    icon: Scissors,
    image: { src: "/images/sf-braiding-hands-1280.webp", alt: "hairdressing" },
  },
  { open: false, slug: "plumbing", icon: Droplets, image: { src: "/images/trades-plumbing-720.webp", alt: "plumbing" } },
  { open: false, slug: "masonry", icon: BrickWall, image: { src: "/images/sf-hands-wrench-720.webp", alt: "masonry" } },
  { open: false, slug: "carpentry", icon: Hammer, image: { src: "/images/trades-carpentry-720.webp", alt: "carpentry" } },
  { open: false, slug: "welding", icon: Flame, image: { src: "/images/trades-welding-720.webp", alt: "welding" } },
  { open: false, slug: "mechanic", icon: Cog, image: { src: "/images/sf-mechanic-apron-720.webp", alt: "mechanic" } },
  { open: false, slug: "tailoring", icon: Shirt, image: { src: "/images/trades-tailoring-720.webp", alt: "tailoring" } },
  { open: false, slug: "beauty", icon: Sparkles, image: { src: "/images/sf-braiding-hands-720.webp", alt: "beauty" } },
  { open: false, slug: "solar", icon: Sun, image: { src: "/images/trades-solar-720.webp", alt: "solar" } },
  { open: false, slug: "mamaFua", icon: WashingMachine },
  { open: false, slug: "movers", icon: Truck },
];

export const OPEN_TRADES: readonly OpenTrade[] = TRADES.filter((trade): trade is OpenTrade => trade.open);
export const BENCH_TRADES: readonly BenchTrade[] = TRADES.filter((trade): trade is BenchTrade => !trade.open);

export function isOpenTradeSlug(value: unknown): value is OpenTradeSlug {
  return OPEN_TRADES.some((trade) => trade.slug === value);
}

/** "Verify now" pre-selects the trade; /join carries it through to sign-up (#14 review). */
export function verifyHref(slug: OpenTradeSlug): string {
  return `${JOIN_FUNDI_PATH}&trade=${slug}`;
}
