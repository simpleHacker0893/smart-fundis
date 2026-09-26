import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp();
// Global write caps (#29: contact.send). See convex/lib/rateLimiter.ts.
app.use(rateLimiter);

export default app;
