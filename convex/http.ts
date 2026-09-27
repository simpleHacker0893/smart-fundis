import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { callbackBodyValidator, claimBodyValidator, MAX_WORKER_ID_LENGTH } from "./lib/aiContract";
import { isWorkerAuthorized } from "./lib/aiSecret";
import { isStubEnabled, isStubName } from "./lib/aiStub";
import { conforms } from "./lib/conforms";

// The pull-model AI contract (spec §6, ADR-9). Brev calls out to these; there
// is no inbound port on Brev. These handlers never log a request or a job:
// the job carries the signed video URL.
//
// Status codes. Both routes: 401 (bad or missing bearer, always checked
// first), 400 `{ error: "bad_request" }` for a bad body, and 403
// `{ error: "stub_disabled" }` for the V1 stub worker when the dev-only
// AI_STUB_ENABLED flag is not "1" (lib/aiStub.ts, RAI S2).
// - /ai/claim: 200 job, 204 nothing queued. 403 when the workerId starts with
//   "stub" (any case); nothing is claimed, even when a row is queued.
// - /ai/callback: 200 `{ status }`, 409 `{ error: "stale" }`, 400
//   `{ error: "unknown_item" | "duplicate_item" | "out_of_range" }`. 403 when
//   a result's model or the Assessment's claimedBy starts with "stub"; it is
//   checked before the stale check and writes nothing (aiJobs.callback).

const http = httpRouter();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** The parsed JSON body, or undefined when it isn't JSON (conforms then refuses it). */
async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

const authorized = (req: Request) =>
  isWorkerAuthorized(req.headers.get("Authorization"), process.env.AI_SHARED_SECRET);

http.route({
  path: "/ai/claim",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!(await authorized(req))) {
      return json(401, { error: "unauthorized" });
    }
    const body = await readJson(req);
    if (
      !conforms(claimBodyValidator, body) ||
      body.workerId.length === 0 ||
      body.workerId.length > MAX_WORKER_ID_LENGTH
    ) {
      return json(400, { error: "bad_request" });
    }
    if (!isStubEnabled() && isStubName(body.workerId)) {
      return json(403, { error: "stub_disabled" });
    }
    const job = await ctx.runMutation(internal.aiJobs.claim, { workerId: body.workerId });
    return job === null ? new Response(null, { status: 204 }) : json(200, job);
  }),
});

http.route({
  path: "/ai/callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!(await authorized(req))) {
      return json(401, { error: "unauthorized" });
    }
    const body = await readJson(req);
    if (!conforms(callbackBodyValidator, body)) {
      return json(400, { error: "bad_request" });
    }
    const result = await ctx.runMutation(internal.aiJobs.callback, { body });
    if (!result.ok) {
      const status = result.reason === "stub_disabled" ? 403 : result.reason === "stale" ? 409 : 400;
      return json(status, { error: result.reason });
    }
    return json(200, { status: result.status });
  }),
});

export default http;
