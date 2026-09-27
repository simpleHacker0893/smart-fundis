import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  expect,
  type Locator,
  type Page,
  test,
  type TestInfo,
} from "@playwright/test";
import en from "../messages/en.json";
import {
  convexCliReady,
  type CosmosTunnel,
  missingRealLoopEnv,
  openCosmosTunnel,
  readAssessmentAi,
  realLoopSkipMessage,
  seedExpert,
  startRealWorker,
  startStubWorker,
  type StubRun,
} from "./dev-deployment";
import {
  clerkApi,
  expectNoSideScroll,
  newTestEmail,
  noReload,
  onboardAsFundi,
  signInAsNewUser,
  tapBottomNav,
} from "./helpers";

// V2 spike (P5 "the end-to-end test"): the whole demo loop on the REAL AI,
// recorded as a video. full-loop.spec.ts is the same loop on the V1 stub.
// Two serial tests, sharing the Fundi's browser:
//   A. A new Fundi onboards with Electrical and uploads the real clip
//      docs/demo_videos/electrical_video.mp4 (the operator confirmed consent)
//      for Electrical → Install a 13A socket. The chip goes In line → AI
//      checking → Awaiting expert review with no reload, driven by
//      ai-service/scripts/brev_worker.py: Cosmos Reason 2 on the Brev box
//      (through an SSH tunnel) plus hosted Nemotron. What the worker did
//      (the Assessment id, model tag, Verdict, timings) is read from its log.
//   B. A seeded Expert opens the Assessment: real Observations with evidence
//      (not the stub's canned text), the Liveness "AI read" line, and a Verdict
//      of needs_review or fail, never pass (no code on paper in the clip,
//      ADR-11; Cosmos reads a safety item as "unclear" or "no" from run to
//      run). The Expert approves; the Fundi sees the Badge; signed out,
//      /f/<id> says "Verified by Smart Fundis", never "certified".
//
// Video: every context records. After A passes, the .webm files are copied to
// docs/demo_videos/e2e/ (01-fundi, 02-expert-review, 03-public-profile) and
// merged into full-loop-real.mp4 when ffmpeg is on PATH or FFMPEG names one.
//
// Prerequisites (dev only; the tests skip and name what is missing):
//   - Everything full-loop.spec.ts needs (Clerk e2e keys, CONVEX_URL,
//     AI_SHARED_SECRET, CONVEX_SITE_URL, CONVEX_DEPLOYMENT=dev:…, `uv`).
//   - ai-service/scripts/brev_worker.py, and NVIDIA_API_KEY in the repo-root .env.
//   - The Brev box up with vLLM serving Cosmos Reason 2 on its port 8000, and
//     the `smartfundi` SSH alias (`brev refresh`). The spec opens
//     `ssh -N -L 18000:127.0.0.1:8000 smartfundi` itself, or reuses a tunnel
//     that is already up, and closes only the one it opened.
//   - Google Chrome: Playwright's Chromium can't play H.264, and the Expert
//     must watch the clip through to unlock the AI suggestion (D-51).
//   - B only: `pnpm exec convex run` must reach the dev deployment (a Convex
//     login with access to the project, or CONVEX_DEPLOY_KEY), since
//     seed:expert is internal; and ALLOW_DEV_SEED=true on dev.
//   - No other worker (stub or real) polling dev: two pollers race.
//
// Leftover `queued` rows from older runs are cleared with the stub worker
// BEFORE this run's upload (never while the real worker runs), so the real
// worker's one job is this run's clip.

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CLIP = path.join(REPO_ROOT, "docs", "demo_videos", "electrical_video.mp4");
const VIDEO_OUT = path.join(REPO_ROOT, "docs", "demo_videos", "e2e");

const u = en.UploadFlow;
const status = en.StatusChip;
const rd = en.ReviewDetail;
const electrical = en.TradeCatalogue.electrical.name;
const socket = en.Rubrics["13a-socket"].name;
const FUNDI_NAME = "Demo Fundi Real AI";

const VIEWPORT = { width: 360, height: 780 };
// Twice the CSS size, so the text in the recording stays sharp.
const VIDEO_SIZE = { width: 720, height: 1560 };
// Claim to callback is about 60–65 s on the spike (Cosmos 45–63 s, Nemotron 7–16 s).
const AI_STEP_TIMEOUT = 5 * 60_000;
const MAX_DRAIN_RUNS = 30;
// A stub run that has claimed nothing this long after starting means nothing is queued.
const DRAIN_IDLE_MS = 15_000;
const MAX_REAL_RUNS = 3;
// A pause so a person watching the recording can read the screen.
const BEAT = 1_500;

// Chrome (not Chromium) for H.264, and the demo's recording settings: this
// file only. Worker-scoped options must be top-level (a describe can't set them).
test.use({
  channel: "chrome",
  viewport: VIEWPORT,
  video: { mode: "on", size: VIDEO_SIZE },
});

type WorkerReport = {
  assessmentId: string;
  modelTag: string | null;
  outcome: string;
  verdict: string | null;
  totalS: number | null;
  cosmosS: number | null;
  nemotronS: number | null;
};

test.describe.configure({ mode: "serial" });

test.describe("the demo loop on the real AI, recorded", () => {
  const clerkUserIds: string[] = [];
  const recorded: { name: string; page: Page }[] = [];
  let tunnel: CosmosTunnel | null = null;
  let worker: StubRun | undefined;
  let videoDir = "";
  let fundi: Page;
  let chip: Locator;
  let report: WorkerReport | undefined;
  let halfDone = false;
  const timing: Record<string, unknown> = {};
  let started = 0;

  test.beforeAll(async ({}, testInfo) => {
    const missing = missingRealLoopEnv();
    test.skip(missing.length > 0, realLoopSkipMessage(missing));
    tunnel = await openCosmosTunnel();
    test.skip(
      tunnel === null,
      realLoopSkipMessage([
        "Cosmos (vLLM) did not answer through `ssh -N -L 18000:127.0.0.1:8000 smartfundi`: start the Brev box and vLLM, and check the SSH alias",
      ]),
    );
    videoDir = path.join(testInfo.project.outputDir, "full-loop-real-videos");
    started = Date.now();
  });

  test.afterAll(async () => {
    worker?.stop();
    tunnel?.stop();
    // Closing a context finishes its video; keep the recordings only when the real-AI half ran.
    for (const { page } of recorded) await page.context().close().catch(() => {});
    if (halfDone) await saveDemoVideos(recorded);
    for (const id of clerkUserIds) await clerkApi("DELETE", `/users/${id}`);
    timing.totalS = round((Date.now() - started) / 1_000);
    console.log(`real-loop timing: ${JSON.stringify(timing)}`);
  });

  const newRecordedPage = async (browser: Browser, testInfo: TestInfo, name: string): Promise<Page> => {
    const { isMobile, hasTouch, deviceScaleFactor, baseURL } = testInfo.project.use;
    const options: BrowserContextOptions = {
      viewport: VIEWPORT,
      isMobile,
      hasTouch,
      deviceScaleFactor,
      baseURL,
      recordVideo: { dir: videoDir, size: VIDEO_SIZE },
    };
    const context = await browser.newContext(options);
    await hideNextDevOverlay(context);
    const page = await context.newPage();
    recorded.push({ name, page });
    return page;
  };

  test("A: real upload → Cosmos + Nemotron → Awaiting expert review", async ({ browser }, testInfo) => {
    test.setTimeout(10 * 60_000);

    // 0. Clear leftover queued rows with the stub, so the real worker's one job is ours.
    await drainQueuedWithStub((run) => (worker = run));

    // 1. The Fundi signs up, onboards with Electrical and uploads the real clip.
    fundi = await newRecordedPage(browser, testInfo, "01-fundi");
    const fundiId = await signInAsNewUser(fundi, "realloop-fundi");
    if (fundiId) clerkUserIds.push(fundiId);
    await onboardAsFundi(fundi, { name: FUNDI_NAME, trade: electrical });
    await fundi.waitForTimeout(BEAT);
    await uploadRealClip(fundi);
    await fundi.waitForTimeout(BEAT);

    // 2. Home, with no reload from here on; the chip says In line.
    await noReload.mark(fundi);
    await tapBottomNav(fundi, en.AppShell.bottom.home, /\/fundi$/);
    const row = fundi.getByTestId("verification-row").first();
    chip = row.getByTestId("status-chip");
    await expect(row).toContainText(socket);
    await expect(row).toContainText(electrical);
    await expect(chip).toHaveAttribute("data-status", "queued");
    await expect(chip).toContainText(status.queued);
    await expectNoSideScroll(fundi);
    await fundi.waitForTimeout(BEAT);

    // The real worker claims it (AI checking), then posts the result (Awaiting expert review).
    const aiStarted = Date.now();
    const ourRun = await runRealUntilAnalyzing(fundi, chip, (run) => (worker = run));
    const analyzingAt = Date.now();
    await expect(chip).toContainText(status.analyzing);
    await expect(chip, `the real worker did not finish:\n${ourRun.logTail()}`).not.toHaveAttribute(
      "data-status",
      "analyzing",
      { timeout: AI_STEP_TIMEOUT },
    );
    const aiDoneAt = Date.now();
    timing.aiStepS = round((aiDoneAt - aiStarted) / 1_000);
    timing.analyzingOnScreenS = round((aiDoneAt - analyzingAt) / 1_000);
    const landed = await chip.getAttribute("data-status");
    expect(landed, `expected awaiting_review, got ${landed}. Worker log:\n${ourRun.logTail()}`).toBe(
      "awaiting_review",
    );
    await expect(chip).toContainText(status.awaiting_review);
    expect(await noReload.held(fundi)).toBe(true);
    const code = await ourRun.exited;
    expect(code, `brev_worker exited ${code}:\n${ourRun.logTail()}`).toBe(0);
    await fundi.waitForTimeout(2 * BEAT);

    // What the real worker did, from its own log: our row, a real result, never pass.
    report = parseWorkerLog(ourRun.logText());
    Object.assign(timing, {
      workerTotalS: report.totalS,
      cosmosS: report.cosmosS,
      nemotronS: report.nemotronS,
      verdict: report.verdict,
      modelTag: report.modelTag,
    });
    expect(report.outcome, ourRun.logTail()).toBe("result");
    expect(report.modelTag, "the worker logged no model tag").not.toBeNull();
    expect(report.modelTag?.toLowerCase().startsWith("stub")).toBe(false);
    expect(report.verdict).not.toBe("pass");
    expect(["needs_review", "fail"]).toContain(report.verdict);
    console.log(`real-loop verdict: ${report.verdict}`);
    halfDone = true;
  });

  test("B: the Expert reviews and approves → the Badge on /f/[id]", async ({ browser }, testInfo) => {
    test.setTimeout(6 * 60_000);
    test.skip(
      !convexCliReady(),
      "Expert half skipped: `pnpm exec convex run` can't reach the dev deployment (seed:expert is internal). " +
        "Log the Convex CLI in with access to the dev project (`pnpm exec convex login`), or set CONVEX_DEPLOY_KEY for dev.",
    );
    if (!report) throw new Error("test A left no worker report");
    const { assessmentId } = report;
    const verdict = report.verdict as "needs_review" | "fail";

    // The stored result, straight from dev: the real model, not the stub, capped by ADR-11.
    const ai = readAssessmentAi(assessmentId);
    expect(ai.status).toBe("awaiting_review");
    expect(ai.model?.toLowerCase().startsWith("stub")).toBe(false);
    expect(ai.claimedBy?.toLowerCase().startsWith("stub")).toBe(false);
    expect(ai.verdict).toBe(verdict);
    expect(ai.livenessCheck).not.toBe("yes");
    expect(ai.observations.length).toBeGreaterThan(0);
    for (const o of ai.observations) {
      expect(o.evidence.trim().length, `empty evidence for ${o.itemId}`).toBeGreaterThan(0);
      expect(o.evidence).not.toMatch(/stub result|canned/i);
      expect(o.timestampS).toBeGreaterThanOrEqual(0);
    }

    // 3. A second User becomes the Expert and reviews it.
    const expert = await newRecordedPage(browser, testInfo, "02-expert-review");
    const expertEmail = newTestEmail("realloop-expert");
    const expertId = await signInAsNewUser(expert, "realloop-expert", expertEmail);
    if (expertId) clerkUserIds.push(expertId);
    await expect(async () => seedExpert(expertEmail)).toPass({ timeout: 60_000, intervals: [1_000, 2_000] });
    await expert.goto("/expert");
    await expect(expert.getByRole("heading", { level: 1, name: en.ReviewQueue.title })).toBeVisible();
    await expert.waitForTimeout(BEAT);
    // Leftover awaiting_review rows can push ours past the queue's cap: open it by its URL.
    await expert.goto(`/expert/${assessmentId}`);
    await expect(expert.getByRole("heading", { level: 1, name: socket })).toBeVisible();

    // The real Observations, with the AI's evidence in quotes, none of it canned.
    const observations = expert.getByTestId("observation");
    await expect(observations.first()).toBeVisible();
    const evidence = expert.locator("[data-testid=observation] q");
    await expect(evidence.first()).toBeVisible();
    const evidenceTexts = await evidence.allInnerTexts();
    expect(evidenceTexts.length).toBeGreaterThan(0);
    for (const text of evidenceTexts) expect(text).not.toMatch(/stub result|canned/i);

    // The Liveness readout: the AI read line (digits, or "not readable") and the check.
    const liveness = expert.getByTestId("liveness");
    await expect(liveness).toContainText(rd.liveness.title);
    const readLine = ai.livenessReadPresent
      ? new RegExp(escapeRegExp(rd.liveness.read.replace("{code}", "")) + String.raw`\S+`, "i")
      : new RegExp(escapeRegExp(rd.liveness.notReadable), "i");
    await expect(liveness).toContainText(readLine);
    const checkWord = rd.liveness.result[ai.livenessCheck ?? "none"];
    await expect(liveness).toContainText(new RegExp(escapeRegExp(rd.liveness.check.replace("{result}", checkWord)), "i"));
    await liveness.scrollIntoViewIfNeeded();
    await expert.waitForTimeout(BEAT);
    await observations.first().scrollIntoViewIfNeeded();
    await expert.waitForTimeout(2 * BEAT);

    // The AI suggestion unlocks only once the Expert has watched the whole clip (D-51).
    const suggestion = expert.getByTestId("ai-suggestion");
    await expect(suggestion).toHaveAttribute("data-locked", "true");
    await watchWholeVideo(expert);
    await expect(suggestion).toHaveAttribute("data-locked", "false", { timeout: 90_000 });
    await expect(suggestion).toContainText(rd.ai.verdict.replace("{verdict}", rd.ai.verdictWord[verdict]));
    await expect(suggestion).not.toContainText(rd.ai.verdict.replace("{verdict}", rd.ai.verdictWord.pass));
    await suggestion.scrollIntoViewIfNeeded();
    await expert.waitForTimeout(2 * BEAT);

    // The Expert approves: only this creates the Badge. The AI only recommends,
    // so Approve is offered on a fail too; if it ever isn't, the demo ends at
    // the Expert asking for a new video, with no Badge.
    const approve = expert.getByRole("radio", { name: en.DecisionForm.choice.approve });
    const approveOffered = (await approve.count()) > 0 && (await approve.isEnabled());
    timing.decision = approveOffered ? "approve" : "reshoot";
    const choice = approveOffered ? approve : expert.getByRole("radio", { name: en.DecisionForm.choice.reshoot });
    await choice.scrollIntoViewIfNeeded();
    await choice.check();
    if (!approveOffered) {
      await expert.getByLabel(en.DecisionForm.noteLabel).fill("Please film the paper code and the tester reading.");
    }
    await expert.waitForTimeout(BEAT);
    await expert.getByRole("button", { name: en.DecisionForm.submit }).tap();
    await expect(expert).toHaveURL(/\/expert$/);
    await expert.waitForTimeout(BEAT);
    if (!approveOffered) {
      await expect(chip).toHaveAttribute("data-status", "reshoot");
      return;
    }

    // The Fundi's home shows the approval and the Badge line, still without a reload.
    await fundi.bringToFront();
    await expect(chip).toHaveAttribute("data-status", "approved");
    await expect(chip).toContainText(status.approved);
    const badgeLine = badgeLinePattern(electrical, socket);
    await expect(fundi.getByTestId("badge-line")).toHaveText([badgeLine]);
    expect(await noReload.held(fundi)).toBe(true);
    await fundi.getByTestId("badge-line").scrollIntoViewIfNeeded();
    await fundi.waitForTimeout(2 * BEAT);
    const profileHref = await fundi.getByRole("link", { name: en.FundiPage.publicProfile.link }).getAttribute("href");
    expect(profileHref).toMatch(/^\/f\/\w+$/);
    if (!profileHref) throw new Error("the public-profile link has no href");

    // 4. Signed out, the public profile shows "Verified by Smart Fundis", never "certified".
    const visitor = await newRecordedPage(browser, testInfo, "03-public-profile");
    await setupClerkTestingToken({ page: visitor });
    await visitor.goto(profileHref);
    await expect(visitor.getByRole("heading", { level: 1, name: FUNDI_NAME })).toBeVisible();
    await expect(visitor.getByTestId("badge-line")).toHaveText([badgeLine]);
    await expect(visitor.getByTestId("badge-line")).toContainText("Verified by Smart Fundis");
    expect(await visitor.locator("body").innerText()).not.toMatch(/certif/i);
    await expectNoSideScroll(visitor);
    await visitor.waitForTimeout(2 * BEAT);
  });
});

/** Hides the Next dev indicator: at 360 px it sits on the bottom nav's Home tab and swallows taps. */
async function hideNextDevOverlay(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const add = () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    };
    if (document.head) add();
    else document.addEventListener("DOMContentLoaded", add, { once: true });
  });
}

/** The upload flow with the real clip. Starts on /fundi (no Assessment yet), ends on /fundi/record. */
async function uploadRealClip(page: Page): Promise<void> {
  await page.getByRole("link", { name: en.FundiHome.finish.items.firstVideo }).tap();
  await expect(page).toHaveURL(/\/fundi\/record$/);
  await page.waitForTimeout(BEAT);
  await page.getByRole("button", { name: u.pick.choose.replace("{task}", socket) }).tap();
  await page.waitForTimeout(BEAT);
  await page.getByRole("button", { name: u.tips.next }).tap();
  await expect(page.getByTestId("liveness-code")).toHaveText(/^\d{3}$/);
  await page.waitForTimeout(BEAT);
  await page.getByLabel(u.video.choose).setInputFiles(CLIP);
  await page.getByRole("checkbox", { name: /verification consent/ }).check();
  await page.waitForTimeout(BEAT);
  await page.getByRole("button", { name: u.upload, exact: true }).tap();
  await expect(page.getByRole("status").filter({ hasText: u.done })).toBeVisible({ timeout: 120_000 });
}

/**
 * Runs the stub worker (`--once`, no hold) until a run finds nothing queued:
 * each run that claims a leftover row posts its canned result and exits; a
 * run that has claimed nothing after DRAIN_IDLE_MS is stopped, and we're done.
 * Only before this run's upload, and never next to the real worker. If the
 * stub is disabled on dev, the real worker's retry loop takes the leftovers.
 */
async function drainQueuedWithStub(onRun: (run: StubRun) => void): Promise<void> {
  for (let n = 0; n < MAX_DRAIN_RUNS; n++) {
    const run = startStubWorker(0);
    onRun(run);
    const idleUntil = Date.now() + DRAIN_IDLE_MS;
    while (!run.isDone() && !/claimed Assessment/.test(run.logText()) && Date.now() < idleUntil) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!run.isDone() && !/claimed Assessment/.test(run.logText())) {
      run.stop();
      await run.exited;
      return;
    }
    const code = await Promise.race([run.exited, new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 60_000))]);
    if (code === "timeout") {
      run.stop();
      throw new Error(`The stub worker did not finish a leftover row within 60 s:\n${run.logTail()}`);
    }
    if (code !== 0) {
      console.log(`The stub worker exited ${code} while clearing leftovers; the real worker's retries take over.`);
      return;
    }
  }
  throw new Error(`Still leftover queued rows after ${MAX_DRAIN_RUNS} stub runs.`);
}

/**
 * Starts brev_worker.py (one job per run) until a run claims this page's
 * Assessment, and returns that run. After the drain the first run should;
 * a row requeued meanwhile can take one more.
 */
async function runRealUntilAnalyzing(page: Page, chip: Locator, onRun: (run: StubRun) => void): Promise<StubRun> {
  for (let n = 1; n <= MAX_REAL_RUNS; n++) {
    const run = startRealWorker();
    onRun(run);
    const deadline = Date.now() + AI_STEP_TIMEOUT;
    while (Date.now() < deadline) {
      const current = await chip.getAttribute("data-status");
      if (current === "analyzing") return run;
      if (current !== "queued") {
        run.stop();
        throw new Error(
          `The chip went from queued to ${current} without showing analyzing: another worker may be polling dev.\n${run.logTail()}`,
        );
      }
      if (run.isDone()) break;
      await page.waitForTimeout(250);
    }
    if (!run.isDone()) {
      run.stop();
      throw new Error(`brev_worker run ${n} claimed nothing within ${AI_STEP_TIMEOUT / 1_000} s:\n${run.logTail()}`);
    }
    const code = await run.exited;
    if (code !== 0) throw new Error(`brev_worker run ${n} exited ${code}:\n${run.logTail()}`);
  }
  throw new Error(`This run's Assessment was still queued after ${MAX_REAL_RUNS} brev_worker runs.`);
}

/** What brev_worker logged about its one job (it never logs URLs, the code or the digits read). */
function parseWorkerLog(log: string): WorkerReport {
  const claimed = /claimed Assessment (\w+)/.exec(log);
  if (!claimed?.[1]) throw new Error(`brev_worker logged no claim:\n${log.slice(-1_500)}`);
  const id = claimed[1];
  const outcome = new RegExp(String.raw`Assessment ${id}: outcome (\w+)(?: (\w+))? in ([\d.]+) s`).exec(log);
  const cosmos = new RegExp(String.raw`Assessment ${id}: Cosmos .*?, ([\d.]+) s,`).exec(log);
  const nemotron = new RegExp(String.raw`Assessment ${id}: Nemotron \w+ in ([\d.]+) s`).exec(log);
  const model = /model tag (\S+)/.exec(log);
  return {
    assessmentId: id,
    modelTag: model?.[1] ?? null,
    outcome: outcome?.[1] ?? "unknown",
    verdict: outcome?.[2] ?? null,
    totalS: outcome?.[3] ? Number(outcome[3]) : null,
    cosmosS: cosmos?.[1] ? Number(cosmos[1]) : null,
    nemotronS: nemotron?.[1] ? Number(nemotron[1]) : null,
  };
}

/** Plays the Expert's video through (muted), so `ended` fires as for a person watching it. */
async function watchWholeVideo(page: Page): Promise<void> {
  const player = page.getByRole("region", { name: rd.videoLabel }).locator("video");
  await expect(player).toBeVisible();
  await player.scrollIntoViewIfNeeded();
  await player.evaluate(async (video: HTMLVideoElement) => {
    video.muted = true;
    await video.play();
  });
}

/** Copies each (closed) page's recording to docs/demo_videos/e2e/, and merges them into one mp4 when ffmpeg is there. */
async function saveDemoVideos(recorded: { name: string; page: Page }[]): Promise<void> {
  mkdirSync(VIDEO_OUT, { recursive: true });
  const saved: string[] = [];
  for (const { name, page } of recorded) {
    const video = page.video();
    if (!video) continue;
    const file = path.join(VIDEO_OUT, `${name}.webm`);
    await video.saveAs(file);
    saved.push(file);
  }
  const ffmpeg = process.env.FFMPEG || "ffmpeg";
  if (saved.length === 0 || spawnSync(ffmpeg, ["-version"], { stdio: "ignore" }).status !== 0) {
    console.log("ffmpeg not found: kept the .webm files only.");
    return;
  }
  const inputs = saved.flatMap((file) => ["-i", file]);
  const streams = saved.map((_, i) => `[${i}:v]`).join("");
  const merged = spawnSync(
    ffmpeg,
    [
      "-y",
      "-loglevel",
      "error",
      ...inputs,
      "-filter_complex",
      `${streams}concat=n=${saved.length}:v=1:a=0[v]`,
      "-map",
      "[v]",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "28",
      "-movflags",
      "+faststart",
      path.join(VIDEO_OUT, "full-loop-real.mp4"),
    ],
    { encoding: "utf8" },
  );
  if (merged.status !== 0) console.log(`ffmpeg merge failed: ${merged.stderr.slice(-500)}`);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The Badge line from en.json itself, with any medium date, so it can't drift. */
function badgeLinePattern(trade: string, task: string): RegExp {
  const pattern = escapeRegExp(en.PublicProfile.badgeLine)
    .replace(escapeRegExp("{trade}"), () => escapeRegExp(trade))
    .replace(escapeRegExp("{task}"), () => escapeRegExp(task))
    .replace(escapeRegExp("{date}"), () => String.raw`\S+ \d{1,2}, \d{4}`);
  return new RegExp(`^${pattern}$`);
}
