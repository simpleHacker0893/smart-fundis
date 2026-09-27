import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { claimBodyValidator, MAX_WORKER_ID_LENGTH } from "./lib/aiContract";
import { isWorkerAuthorized } from "./lib/aiSecret";
import { conforms } from "./lib/conforms";

// The pull-model AI contract (spec §6, ADR-9). Brev calls out to these; there
// is no inbound port on Brev. These handlers never log a request or a job:
// the job carries the signed video URL.

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
    const job = await ctx.runMutation(internal.aiJobs.claim, { workerId: body.workerId });
    return job === null ? new Response(null, { status: 204 }) : json(200, job);
  }),
});

export default http;
