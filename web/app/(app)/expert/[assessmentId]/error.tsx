"use client"; // Error boundaries must be Client Components

import { PAGE } from "../expert-styles";
import { NotAvailable } from "./review-detail";

/**
 * reviews.detail throws for an id that is not an Assessment id (a mistyped
 * URL). Show the same "not available" message as a null detail, with the way
 * back to the queue, and never the error text. Next.js 16.3 calls an error
 * boundary with `{ error, retry, reset }`; a future "Try again" button should
 * call `retry()` (it re-fetches), not `reset()` (it only clears the error
 * state). There is no retry button here, so the props are unused.
 */
export default function ReviewError(_props: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  return (
    <main className={PAGE}>
      <NotAvailable />
    </main>
  );
}
