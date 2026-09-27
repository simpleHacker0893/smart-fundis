import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import path from "node:path";
import type { Doc } from "@convex/_generated/dataModel";
import { loadRootEnv, missingE2eEnv } from "./env";

// Test-only access to the DEV Convex deployment and the #40 stub worker, for
// e2e/full-loop.spec.ts. Everything here shells out to the same commands an
// operator runs by hand; nothing prints a secret or a video URL.

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const AI_SERVICE_DIR = path.join(REPO_ROOT, "ai-service");

/**
 * An allow-listed copy of the environment for a child process: the named
 * variables and those with the given prefixes, when set. Children never see
 * the rest (never CLERK_SECRET_KEY).
 */
function childEnv(names: readonly string[], prefixes: readonly string[]): NodeJS.ProcessEnv {
  // A cast: Next's types make NODE_ENV required on ProcessEnv, and a child needs none.
  const env = {} as NodeJS.ProcessEnv;
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (names.includes(key) || prefixes.some((prefix) => key.startsWith(prefix))) env[key] = value;
  }
  return env;
}

// What each child needs: PATH and HOME to find its tools and caches (and
// SYSTEMROOT/TMPDIR where set); uv reads UV_* and XDG_*; the convex CLI reads
// CONVEX_* (the deployment) and XDG_* (its config dir).
const BASE_ENV = ["PATH", "HOME", "SYSTEMROOT", "TMPDIR"] as const;
const WORKER_ENV = [...BASE_ENV, "AI_SHARED_SECRET", "CONVEX_SITE_URL", "CONVEX_DEPLOYMENT"] as const;
const CONVEX_CLI_ENV = [...BASE_ENV, "CONVEX_DEPLOYMENT"] as const;

function hasUv(): boolean {
  const result = spawnSync("uv", ["--version"], { stdio: "ignore", env: childEnv(BASE_ENV, ["UV_", "XDG_"]) });
  return result.error === undefined && result.status === 0;
}

let missingCache: string[] | undefined;

/**
 * What the full-loop run needs on top of the Clerk e2e env, empty when ready.
 * Names only, never values. Call it lazily (in a hook, not at module load),
 * since it spawns `uv --version`; the result is cached for the run.
 */
export function missingFullLoopEnv(): string[] {
  if (missingCache) return missingCache;
  const missing = missingE2eEnv();
  loadRootEnv();
  if (!process.env.AI_SHARED_SECRET) missing.push("AI_SHARED_SECRET (the same value as on the dev deployment)");
  if (!process.env.CONVEX_SITE_URL) missing.push("CONVEX_SITE_URL (the dev deployment's .convex.site URL)");
  if (!process.env.CONVEX_DEPLOYMENT?.startsWith("dev:")) {
    missing.push("CONVEX_DEPLOYMENT=dev:… (the stub worker never runs against any other deployment)");
  }
  if (!hasUv()) missing.push("`uv` on PATH (it runs ai-service/scripts/stub_worker.py)");
  missingCache = missing;
  return missing;
}

export function fullLoopSkipMessage(missing: string[]): string {
  return `Full-loop e2e skipped: set ${missing.join(", ")}. See the prerequisites at the top of e2e/full-loop.spec.ts.`;
}

/** Runs `pnpm exec convex run <args>` against the dev deployment and returns the parsed JSON result (null when empty). */
function convexRun(args: string[]): unknown {
  const result = spawnSync("pnpm", ["exec", "convex", "run", ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: childEnv(CONVEX_CLI_ENV, ["CONVEX_", "XDG_"]),
    timeout: 60_000,
  });
  if (result.status !== 0) {
    // stderr carries the ConvexError code and message; it holds no secret.
    throw new Error(`convex run ${args[0]} failed (exit ${result.status}): ${result.stderr.trim().slice(-500)}`);
  }
  const out = result.stdout.trim();
  return out === "" ? null : (JSON.parse(out) as unknown);
}

/**
 * Makes the User with this email an Expert for Electrical (#41 seed.expert,
 * dev only: the deployment needs ALLOW_DEV_SEED=true). Throws `no_user` until
 * users.store has created the row after sign-in, so callers retry.
 */
export function seedExpert(email: string): void {
  convexRun(["seed:expert", JSON.stringify({ email })]);
}

export type NewestAssessment = {
  assessmentId: string | null;
  status: Doc<"assessments">["status"] | null;
};

/**
 * The newest Assessment of the User with this email, read with a sandboxed
 * readonly inline query on dev. The Expert queue row must be matched to this
 * run's Assessment exactly, and no page shows the Fundi an Assessment id.
 */
export function readNewestAssessment(email: string): NewestAssessment {
  const query = `
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", ${JSON.stringify(email)})).unique();
    if (user === null) return { assessmentId: null, status: null };
    const assessment = await ctx.db.query("assessments").withIndex("by_fundiUserId", (q) => q.eq("fundiUserId", user._id)).order("desc").first();
    return { assessmentId: assessment?._id ?? null, status: assessment?.status ?? null };
  `;
  return convexRun(["--inline-query", query]) as NewestAssessment;
}

export type StubRun = {
  /** Resolves with the exit code once the worker has processed one job and exited. */
  exited: Promise<number | null>;
  isDone: () => boolean;
  /** The last lines of the worker's log, for a failure message. It never logs secrets, URLs or clip names (#40). */
  logTail: () => string;
  stop: () => void;
};

/**
 * Starts the #40 stub worker for exactly one job: `--once` claims the oldest
 * `queued` Assessment (polling every second until there is one), holds it in
 * `analyzing` for `holdSeconds` so the page can see that status, then posts a
 * canned result. A plain clip name gives `pass`, so the row lands in
 * `awaiting_review`.
 */
export function startStubWorker(holdSeconds = 5): StubRun {
  const child: ChildProcess = spawn(
    "uv",
    ["run", "python", "scripts/stub_worker.py", "--once", "--poll-interval", "1", "--hold-seconds", String(holdSeconds)],
    { cwd: AI_SERVICE_DIR, env: childEnv(WORKER_ENV, ["UV_", "XDG_"]), stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  const keep = (chunk: Buffer) => {
    log = (log + chunk.toString("utf8")).slice(-2_000);
  };
  child.stdout?.on("data", keep);
  child.stderr?.on("data", keep);
  let done = false;
  const exited = new Promise<number | null>((resolve) => {
    child.on("exit", (code) => {
      done = true;
      resolve(code);
    });
    child.on("error", (error) => {
      done = true;
      log += `\n${error.name}: ${error.message}`;
      resolve(null);
    });
  });
  return {
    exited,
    isDone: () => done,
    logTail: () => log.trim().split("\n").slice(-10).join("\n"),
    stop: () => {
      if (!done) child.kill("SIGINT");
    },
  };
}
