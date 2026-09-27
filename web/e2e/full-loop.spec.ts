import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { type BrowserContextOptions, expect, type Page, test } from "@playwright/test";
import en from "../messages/en.json";
import {
  fullLoopSkipMessage,
  missingFullLoopEnv,
  readNewestAssessment,
  seedExpert,
  startStubWorker,
  type StubRun,
} from "./dev-deployment";
import { clerkApi, expectNoSideScroll, newTestEmail, onboardAsFundi, signInAsNewUser } from "./helpers";

// #42 acceptance: the whole V1 demo (#36) at 360 px, on the stub AI.
//   1. A new Fundi onboards with Electrical and uploads a 13A socket clip.
//   2. The chip says "Waiting in line".
//   3. The #40 stub worker, spawned from here, claims it: the chip goes to
//      "The AI is watching your video", then "Awaiting expert review", with
//      no page reload (this closes #38's partial live-chip criterion).
//   4. A second new User is seeded as the Expert, opens /expert, opens this
//      Assessment and approves it. The Fundi's own page shows the Badge live.
//   5. /fundi links to /f/<id>. Signed out, that page shows "Verified by
//      Smart Fundis — Electrical: Install a 13A socket · <date>", never
//      "certified", and no side-scroll.
//
// Dev prerequisites (never prod; the spec skips with the missing names):
//   - Root .env: the Clerk e2e keys and CONVEX_URL (as the other specs),
//     AI_SHARED_SECRET, CONVEX_SITE_URL, and CONVEX_DEPLOYMENT=dev:… .
//   - On the DEV deployment only:
//       pnpm exec convex env set AI_SHARED_SECRET <same value as the root .env>
//       pnpm exec convex env set AI_STUB_ENABLED 1
//       pnpm exec convex env set ALLOW_DEV_SEED true
//   - This branch's functions pushed (`pnpm exec convex dev --once`), and the
//     Trades seeded (`pnpm exec convex run seed:trades`).
//   - `uv` on PATH, with ai-service's deps (`uv sync` in ai-service/). The
//     worker must support --hold-seconds (#42).
//   - No other stub worker running against dev: it could claim this run's
//     Assessment while the page is not looking.
//
// Leaves on dev: two throwaway Users' rows (the Clerk Users are deleted), one
// tiny stored file, an approved Assessment and an Expert row. Leftover
// `queued` rows from older runs (upload.spec.ts leaves one each time) are
// claimed and given canned results first, one worker run each.

const missing = missingFullLoopEnv();
const u = en.UploadFlow;
const status = en.AssessmentList.status;
const electrical = en.TradeCatalogue.electrical.name;
const socket = en.Rubrics["13a-socket"].name;
// A plain name: no "review" or "reshoot", so the stub's outcome is `pass` (#36 decision 1).
const CLIP_NAME = "e2e-full-loop-socket.mp4";
// Each worker run takes one queued row, oldest first; this caps the leftovers we work through.
const MAX_WORKER_RUNS = 25;
const HOLD_SECONDS = 5;

test.describe("the V1 demo loop at 360 px", () => {
  test.skip(missing.length > 0, fullLoopSkipMessage(missing));

  const clerkUserIds: string[] = [];
  let worker: StubRun | undefined;

  test.afterAll(async () => {
    worker?.stop();
    for (const id of clerkUserIds) await clerkApi("DELETE", `/users/${id}`);
  });

  test("upload → stub → the Expert approves → the Badge on /f/[id]", async ({ page, browser }, testInfo) => {
    test.setTimeout(10 * 60_000);
    // New contexts get the same 360 px mobile settings as the project's own page.
    const { viewport, isMobile, hasTouch, deviceScaleFactor, baseURL } = testInfo.project.use;
    const mobile: BrowserContextOptions = { viewport, isMobile, hasTouch, deviceScaleFactor, baseURL };

    // 1. The Fundi signs up, onboards with Electrical and uploads.
    const fundiEmail = newTestEmail("fullloop-fundi");
    const fundiId = await signInAsNewUser(page, "fullloop-fundi", fundiEmail);
    if (fundiId) clerkUserIds.push(fundiId);
    await onboardAsFundi(page, { name: "E2E Loop Fundi", trade: electrical });
    await uploadSocketClip(page);

    // 2. The new Assessment is queued.
    const item = page.getByTestId("assessment").first();
    const chip = item.getByTestId("status-chip");
    await expect(item).toContainText(`${electrical}: ${socket}`);
    await expect(chip).toHaveAttribute("data-status", "queued");
    await expect(chip).toHaveText(status.queued);
    await expectNoSideScroll(page);

    // 3. The stub worker, until it takes this Assessment. A reload would
    // clear this marker, so its survival proves the chip changed in place.
    await page.evaluate(() => {
      (window as unknown as { __noReload?: boolean }).__noReload = true;
    });
    const ourRun = await runStubUntilAnalyzing(page, chip, (run) => (worker = run));
    await expect(chip).toHaveText(status.analyzing);
    const code = await ourRun.exited;
    expect(code, `stub worker failed:\n${ourRun.logTail()}`).toBe(0);
    await expect(chip).toHaveAttribute("data-status", "awaiting_review", { timeout: 30_000 });
    await expect(chip).toHaveText(status.awaiting_review);
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);

    const ids = readNewestAssessment(fundiEmail);
    expect(ids.status).toBe("awaiting_review");
    expect(ids.assessmentId, "no Assessment for the test User").not.toBeNull();

    // 4. A second User becomes the Expert and approves this Assessment.
    const expertContext = await browser.newContext(mobile);
    const expertPage = await expertContext.newPage();
    const expertEmail = newTestEmail("fullloop-expert");
    const expertId = await signInAsNewUser(expertPage, "fullloop-expert", expertEmail);
    if (expertId) clerkUserIds.push(expertId);
    // users.store runs once the page is signed in; until then seed.expert says no_user.
    await expect(async () => seedExpert(expertEmail)).toPass({ timeout: 60_000, intervals: [1_000, 2_000] });

    await expertPage.goto("/expert");
    await expect(expertPage.getByRole("heading", { level: 1, name: en.ExpertPage.title })).toBeVisible();
    // The queue is oldest first, so this run's Assessment is the newest (last)
    // Electrical: 13A socket row. Leftovers from older runs look the same, so
    // the row is matched by its link to this Assessment's id, and must be last.
    const rows = expertPage.getByTestId("queue-row").filter({ hasText: `${electrical}: ${socket}` });
    const ours = rows.filter({ has: expertPage.locator(`a[href="/expert/${ids.assessmentId}"]`) });
    await expect(ours).toHaveCount(1);
    await expect(rows.last().locator(`a[href="/expert/${ids.assessmentId}"]`)).toHaveCount(1);
    await expectNoSideScroll(expertPage);
    await ours.getByRole("link").tap();

    await expect(expertPage).toHaveURL(new RegExp(`/expert/${ids.assessmentId}$`));
    // The Expert plays nothing: the decision does not depend on it in V1.
    const approve = expertPage.getByRole("radio", { name: en.DecisionForm.choice.approve });
    await approve.check();
    const send = expertPage.getByRole("button", { name: en.DecisionForm.submit });
    expect((await send.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await send.tap();
    await expect(expertPage).toHaveURL(/\/expert$/);
    await expect(expertPage.locator(`a[href="/expert/${ids.assessmentId}"]`)).toHaveCount(0);
    await expertContext.close();

    // The Fundi's own page shows the approval and the Badge line, still without a reload.
    await expect(chip).toHaveAttribute("data-status", "approved");
    const badgeLine = new RegExp(`^Verified by Smart Fundis — ${escapeRegExp(electrical)}: ${escapeRegExp(socket)} · \\S+ \\d{1,2}, \\d{4}$`);
    await expect(item.getByTestId("badge-line")).toHaveText(badgeLine);
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);

    // /fundi links a Listed Fundi to their public profile (onboarding lists them).
    const profileLink = page.getByRole("link", { name: en.FundiPage.publicProfile.link });
    expect((await profileLink.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    const profileHref = await profileLink.getAttribute("href");
    expect(profileHref).toMatch(/^\/f\/\w+$/);
    if (!profileHref) throw new Error("the public-profile link has no href");

    // 5. Signed out, the public profile shows the Badge.
    const publicContext = await browser.newContext(mobile);
    const publicPage = await publicContext.newPage();
    await setupClerkTestingToken({ page: publicPage });
    await publicPage.goto(profileHref);
    await expect(publicPage.getByRole("heading", { level: 1, name: "E2E Loop Fundi" })).toBeVisible();
    await expect(publicPage.getByTestId("county")).toContainText("Nairobi");
    await expect(publicPage.getByTestId("trade")).toHaveText([electrical]);
    await expect(publicPage.getByTestId("badge-line")).toHaveText([badgeLine]);
    await expect(publicPage.getByTestId("not-yet-verified")).toHaveCount(0);
    await expect(publicPage.getByTestId("demo-tag")).toHaveCount(0);
    const shown = await publicPage.locator("body").innerText();
    expect(shown).not.toMatch(/certif/i);
    expect(shown).not.toContain("0712");
    await expect(publicPage.locator("video, iframe, a[href^='tel:']")).toHaveCount(0);
    await expectNoSideScroll(publicPage);

    // A malformed id is a 404 page, not a crash.
    const notFound = await publicPage.goto("/f/not-a-real-id");
    expect(notFound?.status()).toBe(404);
    await expect(publicPage.getByRole("heading", { level: 1, name: en.PublicProfile.notFound.title })).toBeVisible();
    await expectNoSideScroll(publicPage);
    await publicContext.close();
  });
});

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The upload flow as in upload.spec.ts, with a plain clip name so the stub passes it. */
async function uploadSocketClip(page: Page): Promise<void> {
  await page.getByRole("button", { name: u.pick.choose.replace("{task}", socket) }).tap();
  await page.getByRole("button", { name: u.tips.next }).tap();
  await expect(page.getByTestId("liveness-code")).toHaveText(/^\d{3}$/);
  await page.getByLabel(u.video.choose).setInputFiles({
    name: CLIP_NAME,
    mimeType: "video/mp4",
    buffer: Buffer.alloc(64 * 1024, 1),
  });
  await page.getByRole("checkbox", { name: /verification consent/ }).check();
  await page.getByRole("button", { name: u.upload, exact: true }).tap();
  await expect(page.getByRole("status").filter({ hasText: u.done })).toBeVisible({ timeout: 60_000 });
}

/**
 * Spawns `stub_worker.py --once` until one run claims this page's Assessment,
 * and returns that run while it holds it in `analyzing`. A run that claims an
 * older leftover row exits after its callback, and the next run starts. Each
 * run is handed to `onRun` so afterAll can stop it.
 */
async function runStubUntilAnalyzing(
  page: Page,
  chip: ReturnType<Page["getByTestId"]>,
  onRun: (run: StubRun) => void,
): Promise<StubRun> {
  for (let n = 1; n <= MAX_WORKER_RUNS; n++) {
    const run = startStubWorker(HOLD_SECONDS);
    onRun(run);
    // One queued job per run, and the hold is 5 s, so a run that sees none of
    // our status changes within 90 s is stuck (another worker took our row).
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const current = await chip.getAttribute("data-status");
      if (current === "analyzing") return run;
      if (current !== "queued") {
        run.stop();
        throw new Error(
          `The chip went from queued to ${current} without showing analyzing: ` +
            "another stub worker may be running against dev, or the worker lacks --hold-seconds.",
        );
      }
      if (run.isDone()) break;
      await page.waitForTimeout(250);
    }
    if (!run.isDone()) {
      run.stop();
      throw new Error(`Stub worker run ${n} did not finish within 90 s:\n${run.logTail()}`);
    }
    const code = await run.exited;
    if (code !== 0) throw new Error(`Stub worker run ${n} exited ${code}:\n${run.logTail()}`);
  }
  throw new Error(`This run's Assessment was still queued after ${MAX_WORKER_RUNS} stub worker runs.`);
}
