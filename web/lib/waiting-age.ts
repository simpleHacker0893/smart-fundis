/** How long an Assessment has waited, in the largest whole unit that reads well. */
export type WaitingAge = { unit: "now" } | { unit: "minutes" | "hours" | "days"; n: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * The waiting age from `since` (a stored _creationTime) to `now`, computed in
 * the browser (#67): under a minute, whole minutes under an hour, whole hours
 * under two days, then whole days. Floors, so it never overstates the wait.
 */
export function waitingAge(since: number, now: number): WaitingAge {
  const ms = Math.max(0, now - since);
  if (ms < MINUTE) return { unit: "now" };
  if (ms < HOUR) return { unit: "minutes", n: Math.floor(ms / MINUTE) };
  if (ms < 2 * DAY) return { unit: "hours", n: Math.floor(ms / HOUR) };
  return { unit: "days", n: Math.floor(ms / DAY) };
}
