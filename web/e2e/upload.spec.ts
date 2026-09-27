import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import { missingE2eEnv, skipMessage } from "./env";
import { clerkApi, expectNoSideScroll, noReload, onboardAsFundi, signInAsNewUser, tapBottomNav } from "./helpers";

// #38 acceptance at 360 px, on the #67 app-mode pages: /fundi (the home, with
// no verifications yet) → its "First video" link → /fundi/record → Trade →
// Task picker with the Rubric (US-3.2) → recording tips (US-3.3) → the
// Liveness code (US-3.4) → consent link, dialog and tick (US-3.7) → upload
// with progress (US-3.5, US-3.6) → back to /fundi through the bottom nav,
// where the new Assessment's row shows `queued` (US-3.1) with no reload →
// /fundi/showcase for the Showcase links (US-3.8). The row comes from the
// Convex subscription; the page is never reloaded.
//
// Not covered here: a later status change (queued → analyzing). The stub
// worker drives that in full-loop.spec.ts, and test/fundi-page.test.tsx
// covers the chip changing in place from a pushed subscription update.
//
// Needs: the root .env Clerk keys and CONVEX_URL, the Clerk `convex` JWT
// template, the Trades seeded, and the #38 functions on the dev deployment
// (`pnpm exec convex dev --once`). Leaves one tiny stored file and one
// `queued` Assessment for the throwaway User on dev.

const missing = missingE2eEnv();
const u = en.UploadFlow;
const socket = en.Rubrics["13a-socket"];

test.describe("upload at 360 px", () => {
  test.skip(missing.length > 0, skipMessage(missing));

  let userId: string | undefined;

  test.afterAll(async () => {
    if (userId) await clerkApi("DELETE", `/users/${userId}`);
  });

  test("home → /fundi/record: picker → tips → Liveness code → consent → upload → queued on /fundi", async ({ page }) => {
    userId = await signInAsNewUser(page, "upload");
    await onboardAsFundi(page, { name: "E2E Upload Fundi", trade: en.TradeCatalogue.electrical.name });

    // #67: /fundi is the home. With no Assessment yet, MY VERIFICATIONS is
    // empty and FINISH YOUR PROFILE links to the recording; the upload flow
    // itself lives at /fundi/record.
    const home = en.FundiHome;
    await expect(page.getByRole("heading", { level: 1, name: en.FundiPage.title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: home.verificationsTitle })).toBeVisible();
    await expect(page.getByText(en.Verifications.empty.body)).toBeVisible();
    await expect(page.getByTestId("verification-row")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: u.title })).toHaveCount(0);
    await expectNoSideScroll(page);
    await noReload.mark(page);
    await page.getByRole("link", { name: home.finish.items.firstVideo }).tap();
    await expect(page).toHaveURL(/\/fundi\/record$/);
    await expect(page.getByRole("heading", { level: 1, name: en.RecordPage.title })).toBeVisible();
    await expect(page.getByRole("region", { name: u.title })).toBeVisible();
    await expect(page.getByText("E2E Upload Fundi", { exact: true })).toHaveCount(0);

    // US-3.2: the picker shows the Task and its Rubric in plain words.
    await expect(page.getByText(u.pick.task.replace("{task}", socket.name))).toBeVisible();
    await expect(page.getByText(socket.items.isolate)).toBeVisible();
    await expectNoSideScroll(page);
    const film = page.getByRole("button", { name: u.pick.choose.replace("{task}", socket.name) });
    expect((await film.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await film.tap();

    // US-3.3: tips first, including the 13A socket's.
    await expect(page.getByRole("heading", { level: 3, name: u.tips.title })).toBeVisible();
    await expect(page.getByText(u.tips.task["13a-socket"].people)).toBeVisible();
    await page.getByRole("button", { name: u.tips.next }).tap();

    // US-3.4: a large 3-digit Liveness code.
    const code = page.getByTestId("liveness-code");
    await expect(code).toHaveText(/^\d{3}$/);
    expect((await code.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(60);
    await expectNoSideScroll(page);

    // US-3.7: Upload stays disabled until the consent is ticked.
    const upload = page.getByRole("button", { name: u.upload, exact: true });
    await expect(upload).toBeDisabled();
    await page.getByLabel(u.video.choose).setInputFiles({
      name: "e2e-socket.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.alloc(64 * 1024, 1),
    });
    await expect(page.getByText(u.video.chosen.replace("{name}", "e2e-socket.mp4"))).toBeVisible();
    await expect(upload).toBeDisabled();
    // US-3.7: the consent is a link that opens the full text in a dialog on
    // this page (so the chosen video is kept), then a tick.
    const consentLink = page.getByRole("button", { name: u.consent.open, exact: true });
    expect((await consentLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await consentLink.tap();
    const dialog = page.getByRole("dialog", { name: u.consent.title });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2, name: u.consent.title })).toBeFocused();
    await expect(dialog.getByText(u.consent.points.training)).toBeVisible();
    await expectNoSideScroll(page);
    await dialog.getByRole("button", { name: u.consent.close }).tap();
    await expect(dialog).toBeHidden();
    await expect(consentLink).toBeFocused();
    // Esc closes it too, and focus comes back to the link.
    await consentLink.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(consentLink).toBeFocused();
    await expect(page.getByText(u.video.chosen.replace("{name}", "e2e-socket.mp4"))).toBeVisible();

    const consent = page.getByRole("checkbox", { name: /verification consent/ });
    await expect(consent).toHaveAccessibleName(u.consent.agree);
    expect((await consent.locator("xpath=ancestor::label").boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await consent.check();
    await expect(upload).toBeEnabled();
    expect((await upload.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

    // US-3.6: upload, then the flow says it worked.
    await upload.tap();
    await expect(page.getByRole("status").filter({ hasText: u.done })).toBeVisible({ timeout: 60_000 });

    // The flow stays on /fundi/record, back at the picker for another Task.
    await expect(page).toHaveURL(/\/fundi\/record$/);

    // US-3.1: the new Assessment appears on /fundi as `queued`, reached by a
    // client-side tap on the bottom nav, never a reload.
    await tapBottomNav(page, en.AppShell.bottom.home, /\/fundi$/);
    const row = page.getByTestId("verification-row").first();
    await expect(row).toContainText(socket.name);
    await expect(row).toContainText(en.TradeCatalogue.electrical.name);
    const chip = row.getByTestId("status-chip");
    await expect(chip).toHaveAttribute("data-status", "queued");
    // The glyph before the words is aria-hidden; match the words only.
    await expect(chip).toContainText(en.StatusChip.queued);
    expect(await noReload.held(page)).toBe(true);
    await expectNoSideScroll(page);

    // US-3.8: Showcase links have their own page (#67), tagged "Showcase —
    // not verified", and never earn a Badge.
    const sc = en.Showcase;
    await tapBottomNav(page, en.AppShell.bottom.profile, /\/fundi\/showcase$/);
    await expect(page.getByRole("heading", { level: 1, name: en.ShowcasePage.title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: sc.title })).toBeVisible();
    await expect(page.getByText(sc.intro)).toBeVisible();
    // The page's own tag; each saved embed adds its own below.
    await expect(page.getByText(sc.label, { exact: true })).toHaveCount(1);
    const youtube = page.getByLabel(sc.slots.youtube.label, { exact: true });
    await youtube.fill("https://www.youtube.com/watch?v=2tdN85reWN0");
    await page.getByRole("button", { name: sc.slots.youtube.save }).tap();
    await expect(page.getByText(sc.slots.youtube.saved)).toBeVisible();
    const embed = page.getByTitle(sc.youtubeTitle);
    await expect(embed).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/2tdN85reWN0");
    await expect(page.getByText(sc.label, { exact: true })).toHaveCount(2);
    await expect(page.getByText(sc.note)).toBeVisible();
    // The second sample replaces the first: one YouTube slot.
    await youtube.fill("https://www.youtube.com/watch?v=qSHhSnuUcXc");
    await page.getByRole("button", { name: sc.slots.youtube.save }).tap();
    await expect(embed).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/qSHhSnuUcXc");
    // A YouTube link in the TikTok box is refused on the device.
    await page.getByLabel(sc.slots.tiktok.label, { exact: true }).fill("https://www.youtube.com/watch?v=qSHhSnuUcXc");
    await page.getByRole("button", { name: sc.slots.tiktok.save }).tap();
    await expect(page.getByRole("alert").filter({ hasText: sc.errors.tiktok.wrong_site })).toBeVisible();
    await expectNoSideScroll(page);
    await page.getByRole("button", { name: sc.slots.youtube.remove }).tap();
    await expect(embed).toHaveCount(0);
  });
});
