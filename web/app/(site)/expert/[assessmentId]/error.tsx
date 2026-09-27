"use client"; // Error boundaries must be Client Components

import { NotAvailable } from "./review-detail";

/**
 * reviews.detail throws for an id that is not an Assessment id (a mistyped
 * URL). Show the same "not available" message as a null detail, with the way
 * back to the queue, and never the error text.
 */
export default function ReviewError(_props: { error: Error & { digest?: string }; retry: () => void }) {
  return <NotAvailable />;
}
