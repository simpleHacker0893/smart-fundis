"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ChangeEvent, type Ref } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CONSENT_VERSION } from "@convex/lib/assessmentUpload";
import { LABEL } from "@/components/ui/field-label";
import { pillClass } from "@/components/ui/pill";
import { recoveryFor, uploadErrorKey, type UploadErrorKey } from "@/lib/upload-errors";
import { checkVideoBeforeUpload, postVideo } from "@/lib/video-upload";
import { StepNav, type PickerTask, type PickerTrade } from "./upload-flow";

type Upload =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number }
  | { kind: "saving" }
  | { kind: "error"; key: UploadErrorKey };

const PRIMARY = pillClass({ variant: "primary", size: "full", className: "sm:w-auto disabled:opacity-50 disabled:pointer-events-none" });
const SECONDARY = pillClass({ variant: "secondary", size: "full", className: "sm:w-auto" });
/** A file input's visible label, styled as a 48 px pill; the input itself is visually hidden. */
const FILE_LABEL = `${pillClass({ variant: "secondary", size: "full", className: "min-h-12 cursor-pointer sm:w-auto" })} peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring`;
const TICK = "flex min-h-12 cursor-pointer items-start gap-3 py-2 text-base";

/**
 * The last step before an Assessment exists (#38): the Liveness code shown
 * large (US-3.4), then straight away the camera or a saved video (US-3.5),
 * then the verification consent (US-3.7, spec §7): a link that opens the full
 * text in a dialog, the consent tick, and the third-party tick when a client
 * is on camera, just above the upload with progress, retry and
 * clear errors (US-3.6).
 * Upload stays disabled until the required ticks are checked and a valid
 * video is chosen. assessments.create is the authority (US-3.9): it answers
 * `{ ok: false, code }` rather than throwing, and each code has a message.
 */
export function RecordStep({
  trade,
  task,
  onBack,
  onDone,
}: {
  trade: PickerTrade;
  task: PickerTask;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("UploadFlow");
  const id = useId();
  const liveness = useLivenessCode();
  const generateUploadUrl = useMutation(api.assessments.generateUploadUrl);
  const create = useMutation(api.assessments.create);
  const [consent, setConsent] = useState(false);
  const [clientConsent, setClientConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  // Bumped to clear both file inputs when a video can no longer be used.
  const [inputsKey, setInputsKey] = useState(0);
  const [upload, setUpload] = useState<Upload>({ kind: "idle" });

  const consentGiven = consent && (!task.needsClientConsent || clientConsent);
  const busy = upload.kind === "uploading" || upload.kind === "saving";
  const canUpload = consentGiven && file !== null && liveness.code !== null && !busy;

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.currentTarget.files?.[0] ?? null;
    if (picked === null) return;
    const problem = checkVideoBeforeUpload(picked);
    setFile(problem === null ? picked : null);
    setUpload(problem === null ? { kind: "idle" } : { kind: "error", key: problem });
  }

  async function start() {
    const livenessCode = liveness.code;
    if (file === null || livenessCode === null) return;
    setUpload({ kind: "uploading", percent: 0 });
    try {
      const url = await generateUploadUrl();
      const storageId = await postVideo(url, file, (percent) => setUpload({ kind: "uploading", percent }));
      setUpload({ kind: "saving" });
      const result = await create({
        storageId: storageId as Id<"_storage">,
        tradeSlug: trade.slug,
        taskSlug: task.slug,
        consentVersion: CONSENT_VERSION,
        livenessCode,
        ...(task.needsClientConsent ? { clientConsent: true } : {}),
      });
      if (result.ok) {
        onDone();
        return;
      }
      setUpload({ kind: "error", key: result.code });
    } catch (error) {
      setUpload({ kind: "error", key: uploadErrorKey(error) });
    }
  }

  async function newCode() {
    // A video that shows the old code cannot prove the new one: record again.
    setFile(null);
    setInputsKey((k) => k + 1);
    setUpload({ kind: "idle" });
    await liveness.renew();
  }

  const recovery = upload.kind === "error" ? recoveryFor(upload.key) : "none";

  // The full consent opens in a modal <dialog> on this page, so the chosen
  // video is kept (spec §7). Closing it, by Close or Esc, returns focus here.
  const consentLink = useRef<HTMLButtonElement>(null);
  const consentDialog = useRef<HTMLDialogElement>(null);
  function openConsent() {
    const dialog = consentDialog.current;
    if (dialog === null || dialog.open) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("h2")?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3" aria-labelledby={`${id}-code`}>
        <h3 id={`${id}-code`} className="text-lg font-semibold">
          {t("code.title")}
        </h3>
        {liveness.code !== null ? (
          <p
            data-testid="liveness-code"
            role="img"
            aria-label={t("code.label", { code: liveness.code.split("").join(" ") })}
            className="font-mono text-7xl font-bold tracking-[0.2em] tabular-nums"
          >
            {liveness.code}
          </p>
        ) : liveness.failed ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="text-base text-primary">
              {t("code.error")}
            </p>
            <button type="button" className={SECONDARY} onClick={() => void liveness.renew()}>
              {t("code.retry")}
            </button>
          </div>
        ) : (
          <p className="text-base text-foreground/75">{t("code.loading")}</p>
        )}
        <p className="text-base">{t("code.instructions")}</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby={`${id}-video`}>
        <h3 id={`${id}-video`} className="text-lg font-semibold">
          {t("video.title")}
        </h3>
        <p id={`${id}-video-hint`} className="text-sm text-foreground/75">
          {t("video.hint")}
        </p>
        <div key={inputsKey} className="flex flex-col gap-3 sm:flex-row">
          <div>
            <input
              id={`${id}-record`}
              type="file"
              accept="video/*"
              capture="environment"
              className="peer sr-only"
              aria-describedby={`${id}-video-hint`}
              onChange={onFile}
              disabled={busy}
            />
            <label htmlFor={`${id}-record`} className={FILE_LABEL}>
              {t("video.record")}
            </label>
          </div>
          <div>
            <input
              id={`${id}-choose`}
              type="file"
              accept="video/*"
              className="peer sr-only"
              aria-describedby={`${id}-video-hint`}
              onChange={onFile}
              disabled={busy}
            />
            <label htmlFor={`${id}-choose`} className={FILE_LABEL}>
              {t("video.choose")}
            </label>
          </div>
        </div>
        {file ? <p className="text-base break-words">{t("video.chosen", { name: file.name })}</p> : null}
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 flex flex-col items-start text-base">
          {t("consent.before")}{" "}
          <button
            ref={consentLink}
            type="button"
            aria-haspopup="dialog"
            className="inline-flex min-h-12 items-center gap-2 text-lg font-semibold underline decoration-primary underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={openConsent}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3l5 5-5 5" />
            </svg>
            {t("consent.open")}
          </button>
        </legend>
        <label className={TICK}>
          <input
            type="checkbox"
            className="mt-1 size-6 shrink-0 accent-primary"
            checked={consent}
            onChange={(event) => setConsent(event.currentTarget.checked)}
          />
          <span>{t("consent.agree")}</span>
        </label>
        {task.needsClientConsent ? (
          <>
            <label className={TICK}>
              <input
                type="checkbox"
                className="mt-1 size-6 shrink-0 accent-primary"
                aria-describedby={`${id}-client-hint`}
                checked={clientConsent}
                onChange={(event) => setClientConsent(event.currentTarget.checked)}
              />
              <span>{t("consent.client")}</span>
            </label>
            <p id={`${id}-client-hint`} className="text-sm text-foreground/75">
              {t("consent.clientHint")}
            </p>
          </>
        ) : null}
      </fieldset>

      <ConsentDialog ref={consentDialog} onClose={() => consentLink.current?.focus()} />

      <div className="flex flex-col gap-3">
        {!consentGiven ? (
          <p className="text-sm text-foreground/75">
            {task.needsClientConsent ? t("video.needBothTicks") : t("video.needConsent")}
          </p>
        ) : file === null ? (
          <p className="text-sm text-foreground/75">{t("video.needVideo")}</p>
        ) : null}
        <button type="button" className={PRIMARY} disabled={!canUpload} onClick={() => void start()}>
          {t("upload")}
        </button>

        {busy ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-progress`} className={LABEL}>
              {t("progress")}
            </label>
            <progress
              id={`${id}-progress`}
              max={100}
              value={upload.kind === "uploading" ? upload.percent : 100}
              className="h-3 w-full accent-primary"
            />
            <p className="text-sm">
              {upload.kind === "uploading" ? t("uploading", { percent: upload.percent }) : t("saving")}
            </p>
          </div>
        ) : null}

        {upload.kind === "error" ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="text-base text-primary">
              {t(`errors.${upload.key}`)}
            </p>
            {recovery === "retry" ? (
              <button type="button" className={SECONDARY} disabled={!canUpload} onClick={() => void start()}>
                {t("retry")}
              </button>
            ) : recovery === "newCode" ? (
              <button type="button" className={SECONDARY} onClick={() => void newCode()}>
                {t("newCode")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!busy ? <StepNav backLabel={t("back")} onBack={onBack} /> : null}
    </div>
  );
}

const CONSENT_POINTS = ["who", "review", "public", "delete", "training"] as const;

/**
 * The full verification consent (consent-v1, spec §7) as a native modal
 * dialog: labelled by its heading, which takes focus on open; Esc or Close
 * shuts it, and `onClose` runs for both. The Contact page link opens in a
 * new tab, so following it never drops the chosen video.
 */
function ConsentDialog({ ref, onClose }: { ref: Ref<HTMLDialogElement>; onClose: () => void }) {
  const t = useTranslations("UploadFlow");
  const id = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded border border-line bg-background p-6 text-foreground backdrop:bg-black/80"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-title`} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
          {t("consent.title")}
        </h2>
        <p className="text-base text-foreground/75">{t("consent.intro")}</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {CONSENT_POINTS.map((point) => (
            <li key={point} className="text-base">
              {t.rich(`consent.points.${point}`, {
                contact: (chunks) => (
                  <a
                    href="/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby={`${id}-new-tab`}
                    className="underline decoration-primary underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </li>
          ))}
        </ul>
        <span id={`${id}-new-tab`} hidden>
          {t("consent.newTab")}
        </span>
        <button type="button" className={PRIMARY} onClick={(event) => event.currentTarget.closest("dialog")?.close()}>
          {t("consent.close")}
        </button>
      </div>
    </dialog>
  );
}

/**
 * The code to show before recording (US-3.4): the caller's pending code if it
 * has not expired, else a fresh one from newLivenessCode, issued once when
 * the step opens. The query is live, so a renewed code shows as soon as the
 * server has it. assessments.create uses up the code, so each Assessment gets
 * its own.
 */
function useLivenessCode(): { code: string | null; failed: boolean; renew: () => Promise<void> } {
  const current = useQuery(api.assessments.currentLivenessCode, {});
  const issue = useMutation(api.assessments.newLivenessCode);
  // A query must not read the clock, so the client compares expiresAt itself.
  const [openedAt] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);
  const checked = useRef(false);
  const valid = current != null && current.expiresAt > openedAt;

  useEffect(() => {
    if (current === undefined || checked.current) return;
    checked.current = true;
    if (!valid) issue().catch(() => setFailed(true));
  }, [current, valid, issue]);

  return {
    code: valid ? current.code : null,
    failed,
    renew: async () => {
      setFailed(false);
      try {
        await issue();
      } catch {
        setFailed(true);
      }
    },
  };
}
