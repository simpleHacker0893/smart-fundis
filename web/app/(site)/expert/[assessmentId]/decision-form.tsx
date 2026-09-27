"use client";

import type { Id } from "@convex/_generated/dataModel";

export function DecisionForm({ assessmentId }: { assessmentId: Id<"assessments"> }) {
  return <form data-assessment={assessmentId} />;
}
