"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { APP_PRIMARY_PILL } from "@/components/ui/pill";
import { DECIDE_ERRORS, type DecideErrorKey, decideErrorKey, NOTE_MAX_LENGTH } from "@/lib/review-errors";
import { META, SECTION_LABEL } from "../expert-styles";
import { ErrorLine } from "../expert-ui";

type Decision = "approve" | "reshoot" | "reject";

const DECISIONS = ["approve", "reshoot", "reject"] as const satisfies readonly Decision[];

type FormError = DecideErrorKey | "choice";

/** The note field: 48 px min, a neutral (never amber) border when invalid (D9). */
const NOTE_FIELD =
  "min-h-12 w-full rounded border border-line bg-background px-4 py-3 text-base text-foreground placeholder:text-foreground/50 focus-visible:border-foreground/40 aria-invalid:border-foreground";

/**
 * YOUR DECISION (US-5.3; #67 screen 29), outside and below the AI panel:
 * Approve, Ask for a new video (reshoot) or Reject as 56 px radio rows with
 * none pre-selected, and a note that is required for a reshoot or a
 * rejection and at most 1000 characters. The counter may pass 1000 so the
 * Expert sees why; checked here first, then by reviews.decide, whose error
 * codes map to en.json copy. A failed send keeps the choice and the note.
 * On success it goes back to the queue, where the row has already gone.
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
  // Too long shows as the Expert types, not only on submit.
  const tooLong = note.trim().length > NOTE_MAX_LENGTH;
  const shown: FormError | null = error ?? (tooLong ? "note_too_long" : null);
  const noteInvalid = shown === "note_required" || shown === "note_too_long";

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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className={`${SECTION_LABEL} mb-3`}>{t("title")}</legend>
        <p className="text-sm text-dim">{t("intro")}</p>
        <div className="flex flex-col border-t border-line">
          {DECISIONS.map((value) => (
            <label
              key={value}
              htmlFor={`${id}-${value}`}
              className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-line px-2 has-checked:bg-foreground/[0.04]"
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
                className="size-5 accent-(--text)"
              />
              <span className="text-base">{t(`choice.${value}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-note`} className={SECTION_LABEL}>
          {isApprove ? t("noteLabelApprove") : t("noteLabel")}
        </label>
        <textarea
          id={`${id}-note`}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error === "note_required" || error === "note_too_long") setError(null);
          }}
          required={noteRequired}
          aria-invalid={noteInvalid ? true : undefined}
          aria-describedby={noteInvalid ? `${id}-note-hint ${id}-error` : `${id}-note-hint`}
          rows={4}
          className={NOTE_FIELD}
        />
        <div className="flex items-start justify-between gap-4">
          <span id={`${id}-note-hint`} className="text-sm text-dim">
            {noteRequired
              ? t("noteHintRequired", { max: NOTE_MAX_LENGTH })
              : isApprove
                ? t("noteHintApprove", { max: NOTE_MAX_LENGTH })
                : t("noteHintOptional", { max: NOTE_MAX_LENGTH })}
          </span>
          <span data-testid="note-count" className={`${META} shrink-0`} aria-hidden="true">
            {t("noteCount", { count: note.length, max: NOTE_MAX_LENGTH })}
          </span>
        </div>
      </div>

      {shown ? (
        <ErrorLine id={`${id}-error`}>
          {shown === "choice" ? t("choiceRequired") : t(DECIDE_ERRORS[shown], { max: NOTE_MAX_LENGTH })}
        </ErrorLine>
      ) : null}

      <button type="submit" disabled={pending || decision === null} aria-busy={pending} className={APP_PRIMARY_PILL}>
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
