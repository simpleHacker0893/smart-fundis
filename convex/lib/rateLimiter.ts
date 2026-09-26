import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/**
 * App-wide rate limits (@convex-dev/rate-limiter component).
 * - contactGlobal: at most 30 contact messages an hour across all contacts,
 *   on top of contact.send's per-contact throttle (3 in 10 minutes), which a
 *   sender could otherwise dodge by changing the contact each time. A token
 *   bucket (30 capacity, refilling 30 an hour) rather than a fixed window,
 *   whose windows start at a random offset and would allow bursts of 60.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  contactGlobal: { kind: "token bucket", rate: 30, period: HOUR, capacity: 30 },
});
