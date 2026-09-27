import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Stuck AI jobs (spec §3): requeue or fail Assessments claimed > 10 min ago.
crons.interval("requeue stale AI claims", { minutes: 1 }, internal.aiJobs.requeueStale, {});

export default crons;
