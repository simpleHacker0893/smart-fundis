"use client";

import { ConvexContactForm } from "@/components/contact-form-convex";
import { MailtoContactForm } from "@/components/contact-form-mailto";
import { useConvexAvailable } from "@/components/convex-available";

/**
 * The /contact form. With Convex it stores the message (#29); a build without
 * NEXT_PUBLIC_CONVEX_URL has no Convex client, so it falls back to composing
 * an email (#24) rather than calling a hook that would throw.
 */
export function ContactForm({ to }: { to: string }) {
  return useConvexAvailable() ? <ConvexContactForm to={to} /> : <MailtoContactForm to={to} />;
}
