import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import { missingE2eEnv, skipMessage } from "./env";

// #37 acceptance: at 360 px, sign in → the onboarding form → /fundi
// (US-2.3 minimal, US-2.7). A fresh Clerk User is created for each run through
// the Clerk Backend API (development instance only) and deleted afterwards,
// so the run always starts with no Fundi profile.
//
// Needs: the root .env Clerk keys and CONVEX_URL, the Clerk `convex` JWT
// template, and the Trades seeded (`pnpm exec convex run seed:trades`).

const CLERK_API = "https://api.clerk.com/v1";
const missing = missingE2eEnv();

async function clerkApi(method: "POST" | "DELETE", path: string, body?: object): Promise<{ id?: string }> {
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

const t = en.Onboarding;

test.describe("onboarding at 360 px", () => {
  test.skip(missing.length > 0, skipMessage(missing));

  let userId: string | undefined;

  test.afterAll(async () => {
    if (userId) await clerkApi("DELETE", `/users/${userId}`);
  });

  test("sign in → onboarding form → /fundi", async ({ page }) => {
    const email = `e2e-onboarding-${Date.now()}+clerk_test@example.com`;
    userId = (await clerkApi("POST", "/users", { email_address: [email], skip_password_requirement: true })).id;

    // clerk.signIn needs a public page that loads Clerk first (Clerk testing docs).
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: email });

    // No Fundi profile yet, so /dashboard routes to /onboarding (spec §4).
    await page.goto("/dashboard");
    // A Clerk session task (e.g. "choose-organization" when the instance makes
    // Organization membership required) keeps the session pending, so Clerk
    // treats it as signed out. Smart Fundis has no Organizations (ADR-16).
    await expect(
      page,
      "Clerk sent the new session to a session task: turn off required Organization membership in the Clerk Dashboard",
    ).not.toHaveURL(/\/sign-in\/tasks/, { timeout: 5_000 });
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole("heading", { level: 1, name: t.title })).toBeVisible();

    await page.getByLabel(t.name).fill("E2E Fundi");
    await page.getByLabel(t.phone).fill("0712 345 678");
    // Operator change 2: a type-of-work dropdown, then that type's Trades.
    // Pick one Verify now Trade (Electrical) and one that is not (Mama fua).
    const typeSelect = page.getByLabel(en.TradePicker.type);
    await typeSelect.selectOption("skilled");
    const electrical = page.getByRole("checkbox", { name: en.TradeCatalogue.electrical.name, exact: true });
    await electrical.tap();
    await expect(electrical).toBeChecked();
    await typeSelect.selectOption("odd_job");
    await expect(electrical).toBeHidden();
    const mamaFua = page.getByRole("checkbox", { name: en.TradeCatalogue.mamaFua.name, exact: true });
    await mamaFua.tap();
    await expect(mamaFua).toBeChecked();
    // Both stay selected across types, as removable chips.
    await expect(page.getByText(en.TradePicker.selected.replace("{count}", "2"), { exact: true })).toBeVisible();
    for (const trade of [en.TradeCatalogue.electrical.name, en.TradeCatalogue.mamaFua.name]) {
      const chip = page.getByRole("button", { name: en.TradePicker.remove.replace("{trade}", trade) });
      await expect(chip).toBeVisible();
      expect((await chip.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.getByLabel(t.county).selectOption("Nairobi");

    const submit = page.getByRole("button", { name: t.submit });
    const box = await submit.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
    // Nothing scrolls sideways at 360 px.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

    // users.store may still be in flight on a very fast run; the form then asks
    // to retry (no_user), so retry the tap until the profile is saved. The wait
    // is long because a cold `next dev` compiles /dashboard and /fundi on first visit.
    await expect(async () => {
      if (await submit.isEnabled()) await submit.tap();
      await expect(page).toHaveURL(/\/fundi$/, { timeout: 20_000 });
    }).toPass({ timeout: 60_000 });

    // /fundi lets the new Fundi in (spec §4 page guard) and shows what they typed.
    await expect(page.getByRole("heading", { level: 1, name: en.FundiPage.title })).toBeVisible();
    await expect(page.getByText("E2E Fundi", { exact: true })).toBeVisible();
    await expect(page.getByText("Nairobi", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/fundi$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
