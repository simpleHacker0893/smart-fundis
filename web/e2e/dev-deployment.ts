import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
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
  /** The last few KB of the log, URLs masked, for parsing what the worker did. */
  logText: () => string;
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
  return spawnWorker(
    ["run", "python", "scripts/stub_worker.py", "--once", "--poll-interval", "1", "--hold-seconds", String(holdSeconds)],
    childEnv(WORKER_ENV, ["UV_", "XDG_"]),
  );
}

/** Spawns `uv <args>` in ai-service/ and keeps a short, URL-free tail of its log. */
function spawnWorker(args: string[], env: NodeJS.ProcessEnv): StubRun {
  const child: ChildProcess = spawn("uv", args, { cwd: AI_SERVICE_DIR, env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  const keep = (chunk: Buffer) => {
    log = (log + chunk.toString("utf8")).slice(-16_000);
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
    // Belt and braces: the workers never log a URL, but a stack trace could quote one.
    logTail: () => redactUrls(log).trim().split("\n").slice(-15).join("\n"),
    logText: () => redactUrls(log),
    stop: () => {
      if (!done) child.kill("SIGINT");
    },
  };
}

function redactUrls(text: string): string {
  return text.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "<url>");
}

// --- The real AI (V2 spike, P5): brev_worker.py through an SSH tunnel to Brev ---

/** The local end of the SSH tunnel to vLLM on the Brev box (ADR-9: nothing inbound on Brev). */
export const COSMOS_LOCAL_PORT = 18000;
const COSMOS_URL = `http://127.0.0.1:${COSMOS_LOCAL_PORT}`;
const SSH_HOST = "smartfundi";
const BREV_WORKER = path.join(AI_SERVICE_DIR, "scripts", "brev_worker.py");
export const NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b";
// The worker also reads the repo-root .env itself (app.settings); these are what it may see from here.
const REAL_WORKER_ENV = [...WORKER_ENV, "NVIDIA_API_KEY", "COSMOS_MODEL"] as const;

/**
 * What the real-AI loop needs on top of missingFullLoopEnv, empty when ready.
 * Names only. The tunnel itself is checked by openCosmosTunnel.
 */
export function missingRealLoopEnv(): string[] {
  const missing = [...missingFullLoopEnv()];
  if (!existsSync(BREV_WORKER)) missing.push("ai-service/scripts/brev_worker.py (the V2 spike worker, P5)");
  if (!process.env.NVIDIA_API_KEY) missing.push("NVIDIA_API_KEY (hosted Nemotron, in the repo-root .env)");
  const ssh = spawnSync("ssh", ["-V"], { stdio: "ignore" });
  if (ssh.error !== undefined) missing.push("`ssh` on PATH (the tunnel to the Brev box)");
  return missing;
}

export function realLoopSkipMessage(missing: string[]): string {
  return `Real-AI e2e skipped: ${missing.join(", ")}. See the prerequisites at the top of e2e/full-loop-real.spec.ts.`;
}

/** True when vLLM answers on the tunnel's local port. */
export async function cosmosReachable(timeoutMs = 3_000): Promise<boolean> {
  try {
    const response = await fetch(`${COSMOS_URL}/v1/models`, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

export type CosmosTunnel = {
  /** False when a tunnel (or vLLM) was already listening, so we started nothing. */
  ours: boolean;
  stop: () => void;
};

/**
 * Opens `ssh -N -L 18000:127.0.0.1:8000 smartfundi` and waits until vLLM
 * answers through it. Reuses a tunnel that is already up (and leaves it up).
 * Returns null when vLLM is unreachable, so the spec can skip; nothing about
 * the host is printed.
 */
export async function openCosmosTunnel(waitMs = 30_000): Promise<CosmosTunnel | null> {
  if (await cosmosReachable()) return { ours: false, stop: () => {} };
  const child = spawn(
    "ssh",
    [
      "-N",
      "-o",
      "BatchMode=yes",
      "-o",
      "ExitOnForwardFailure=yes",
      "-o",
      "ConnectTimeout=15",
      "-o",
      "ServerAliveInterval=15",
      "-L",
      `${COSMOS_LOCAL_PORT}:127.0.0.1:8000`,
      SSH_HOST,
    ],
    { stdio: "ignore", env: childEnv([...BASE_ENV, "SSH_AUTH_SOCK"], []) },
  );
  let exited = false;
  child.on("exit", () => {
    exited = true;
  });
  child.on("error", () => {
    exited = true;
  });
  const stop = () => {
    if (!exited) child.kill("SIGTERM");
  };
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline && !exited) {
    if (await cosmosReachable()) return { ours: true, stop };
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  stop();
  return null;
}

/**
 * Starts the V2 spike worker (P5) for exactly one job: it claims the oldest
 * `queued` Assessment, observes it with Cosmos Reason 2 through the tunnel,
 * drafts the Verdict with hosted Nemotron, applies ADR-11 and posts the
 * callback. Never run it next to a stub worker: two pollers race.
 */
export function startRealWorker(): StubRun {
  const env = childEnv(REAL_WORKER_ENV, ["UV_", "XDG_"]);
  env.NEMOTRON_MODEL = NEMOTRON_MODEL;
  return spawnWorker(
    ["run", "python", "scripts/brev_worker.py", "--max-jobs", "1", "--poll-interval", "1", "--cosmos-url", COSMOS_URL],
    env,
  );
}

/**
 * True when `convex run` can reach the dev deployment: the CLI's login (or a
 * CONVEX_DEPLOY_KEY) has access to it. seed:expert is internal, so the Expert
 * half of the loop needs this.
 */
export function convexCliReady(): boolean {
  try {
    return convexRun(["--inline-query", "return 1"]) === 1;
  } catch {
    return false;
  }
}

export type AssessmentAi = {
  status: Doc<"assessments">["status"];
  model: string | null;
  claimedBy: string | null;
  verdict: Doc<"assessments">["verdict"] | null;
  latencyMs: number | null;
  fallbackModel: boolean | null;
  safetyFlags: string[];
  livenessReadPresent: boolean;
  livenessCheck: Doc<"assessments">["livenessCheck"] | null;
  observations: { itemId: string; result: string; evidence: string; timestampS: number }[];
};

/**
 * The AI fields of one Assessment, for asserting that the real worker (not
 * the stub) wrote them. Never returns the video, the Liveness code or the
 * digits read (only whether any were read).
 */
export function readAssessmentAi(assessmentId: string): AssessmentAi {
  const query = `
    const id = ctx.db.normalizeId("assessments", ${JSON.stringify(assessmentId)});
    const a = id === null ? null : await ctx.db.get(id);
    if (a === null) throw new Error("no such Assessment");
    return {
      status: a.status,
      model: a.model ?? null,
      claimedBy: a.claimedBy ?? null,
      verdict: a.verdict ?? null,
      latencyMs: a.latencyMs ?? null,
      fallbackModel: a.fallbackModel ?? null,
      safetyFlags: a.safetyFlags ?? [],
      livenessReadPresent: a.livenessRead !== undefined,
      livenessCheck: a.livenessCheck ?? null,
      observations: (a.observations ?? []).map((o) => ({ itemId: o.itemId, result: o.result, evidence: o.evidence, timestampS: o.timestampS })),
    };
  `;
  return convexRun(["--inline-query", query]) as AssessmentAi;
}
