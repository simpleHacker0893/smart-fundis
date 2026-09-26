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

/** Creates a throwaway Clerk User and signs the page in as them. Returns the Clerk user id. */
export async function signInAsNewUser(page: Page, label: string): Promise<string | undefined> {
  const email = `e2e-${label}-${Date.now()}+clerk_test@example.com`;
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
