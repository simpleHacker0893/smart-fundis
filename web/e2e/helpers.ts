import { clerk } from "@clerk/testing/playwright";
import { expect, type Page } from "@playwright/test";
import en from "../messages/en.json";

const CLERK_API = "https://api.clerk.com/v1";

/** The Clerk Backend API (development instance only; the root .env secret key). */
export async function clerkApi(method: "POST" | "DELETE", path: string, body?: object): Promise<{ id?: string }> {
  const response = await fetch(`${CLERK_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Clerk ${method} ${path} failed: HTTP ${response.status}`);
  return (await response.json()) as { id?: string };
}

/** A unique throwaway address for a Clerk test User (lowercase, as Clerk stores it). */
export function newTestEmail(label: string): string {
  return `e2e-${label}-${Date.now()}+clerk_test@example.com`.toLowerCase();
}

/**
 * Creates a throwaway Clerk User and signs the page in as them. Returns the
 * Clerk user id. Pass `email` (from newTestEmail) when the test needs it later.
 */
export async function signInAsNewUser(
  page: Page,
  label: string,
  email: string = newTestEmail(label),
): Promise<string | undefined> {
  const userId = (await clerkApi("POST", "/users", { email_address: [email], skip_password_requirement: true })).id;
  // clerk.signIn needs a public page that loads Clerk first (Clerk testing docs).
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  return userId;
}

/**
 * Fills the minimal onboarding form with one Trade (by its en.json name) and
 * lands on /fundi. Assumes a signed-in User with no Fundi profile.
 */
export async function onboardAsFundi(page: Page, { name, trade }: { name: string; trade: string }): Promise<void> {
  const t = en.Onboarding;
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel(t.name).fill(name);
  await page.getByLabel(t.phone).fill("0712 345 678");
  await page.getByLabel(en.TradePicker.type).selectOption("skilled");
  await page.getByRole("checkbox", { name: trade, exact: true }).tap();
  await page.getByLabel(t.county).selectOption("Nairobi");
  const submit = page.getByRole("button", { name: t.submit });
  // users.store may still be in flight on a fast run; the form then asks to retry.
  await expect(async () => {
    if (await submit.isEnabled()) await submit.tap();
    await expect(page).toHaveURL(/\/fundi$/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
}

/** Nothing scrolls sideways at 360 px. */
export async function expectNoSideScroll(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
}

/**
 * A marker on the page's window: a reload clears it, while a client-side
 * navigation (a Next <Link>) keeps it. While it holds, every change the page
 * showed came from the Convex subscription or client routing, not a reload.
 */
export const noReload = {
  mark: (page: Page) =>
    page.evaluate(() => {
      (window as unknown as { __noReload?: boolean }).__noReload = true;
    }),
  held: (page: Page) => page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true),
};

/**
 * Below 1024 px the AppShell draws a bottom nav (#67). Taps one of its links
 * by its en.AppShell.bottom label: a client-side navigation, not a reload.
 */
export async function tapBottomNav(page: Page, label: string, url: RegExp): Promise<void> {
  const nav = page.getByRole("navigation", { name: en.AppShell.bottomNavLabel });
  await nav.getByRole("link", { name: label, exact: true }).tap();
  await expect(page).toHaveURL(url);
}
