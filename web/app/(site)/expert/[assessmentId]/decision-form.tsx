"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { FIELD, LABEL } from "@/components/ui/field-label";
import { PRIMARY_PILL } from "@/components/ui/pill";
import { DECIDE_ERRORS, type DecideErrorKey, decideErrorKey, NOTE_MAX_LENGTH } from "@/lib/review-errors";

type Decision = "approve" | "reshoot" | "reject";

const DECISIONS = ["approve", "reshoot", "reject"] as const satisfies readonly Decision[];

type FormError = DecideErrorKey | "choice";

/**
 * The Expert's decision on an Assessment awaiting review (US-5.3): approve,
 * request a reshoot, or reject, with a note that is required for a reshoot
 * or a rejection and at most 1000 characters. Checked here first, then by
 * reviews.decide, whose error codes map to en.json copy. On success it goes
 * back to the queue, where the row has already gone (a Convex query).
 */
export function DecisionForm({ assessmentId }: { assessmentId: Id<"assessments"> }) {
  const t = useTranslations("DecisionForm");
  const router = useRouter();
  const decide = useMutation(api.reviews.decide);
  const id = useId();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<FormError | null>(null);
  const [pending, setPending] = useState(false);
  // A ref as well as state, so a second submit in the same tick is ignored.
  const sending = useRef(false);

  const noteRequired = decision === "reshoot" || decision === "reject";
  const isApprove = decision === "approve";
  const noteInvalid = error === "note_required" || error === "note_too_long";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const trimmed = note.trim();
    if (decision === null) return setError("choice");
    if (noteRequired && trimmed === "") return setError("note_required");
    if (trimmed.length > NOTE_MAX_LENGTH) return setError("note_too_long");

    sending.current = true;
    setPending(true);
    setError(null);
    try {
      await decide({ assessmentId, decision, ...(trimmed !== "" ? { note: trimmed } : {}) });
      router.push("/expert");
    } catch (err) {
      setError(decideErrorKey(err));
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded border border-line p-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-semibold">{t("title")}</legend>
        <p className="text-sm text-foreground/75">{t("intro")}</p>
        {DECISIONS.map((value) => (
          <label
            key={value}
            htmlFor={`${id}-${value}`}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded border border-line px-4 has-checked:border-primary"
          >
            <input
              id={`${id}-${value}`}
              type="radio"
              name={`${id}-decision`}
              value={value}
              checked={decision === value}
              onChange={() => {
                setDecision(value);
                setError(null);
              }}
              className="size-5 accent-(--amber)"
            />
            <span className="text-base">{t(`choice.${value}`)}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-note`} className={LABEL}>
          {isApprove ? t("noteLabelApprove") : t("noteLabel")}
        </label>
        <textarea
          id={`${id}-note`}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (noteInvalid) setError(null);
          }}
          maxLength={NOTE_MAX_LENGTH}
          required={noteRequired}
          aria-invalid={noteInvalid ? true : undefined}
          aria-describedby={`${id}-note-hint`}
          rows={4}
          className={`${FIELD} py-3`}
        />
        <span id={`${id}-note-hint`} className="text-sm text-foreground/75">
          {noteRequired
            ? t("noteHintRequired", { max: NOTE_MAX_LENGTH })
            : isApprove
              ? t("noteHintApprove", { max: NOTE_MAX_LENGTH })
              : t("noteHintOptional", { max: NOTE_MAX_LENGTH })}
        </span>
        <span className={LABEL} aria-hidden="true">
          {t("noteCount", { count: note.length, max: NOTE_MAX_LENGTH })}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-base text-primary">
          {error === "choice" ? t("choiceRequired") : t(DECIDE_ERRORS[error])}
        </p>
      ) : null}

      <button type="submit" disabled={pending || decision === null} className={PRIMARY_PILL}>
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
