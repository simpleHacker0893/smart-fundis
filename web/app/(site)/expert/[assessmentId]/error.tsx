"use client"; // Error boundaries must be Client Components

import { NotAvailable } from "./review-detail";

/**
 * reviews.detail throws for an id that is not an Assessment id (a mistyped
 * URL). Show the same "not available" message as a null detail, with the way
 * back to the queue, and never the error text. Next.js calls an error
 * boundary with `{ error, reset }` (a `reset: () => void` retry, not
 * `retry`); we don't offer a retry button here, so both are unused.
 */
export default function ReviewError(_props: { error: Error & { digest?: string }; reset: () => void }) {
  return <NotAvailable />;
}
