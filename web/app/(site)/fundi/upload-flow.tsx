"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { LABEL } from "@/components/ui/field-label";
import { PRIMARY_PILL, SECONDARY_PILL } from "@/components/ui/pill";
import { useCatalogueNames } from "@/components/use-catalogue-names";
import type messages from "@/messages/en.json";
import { RecordStep } from "./record-step";

export type PickerTrade = FunctionReturnType<typeof api.trades.uploadPicker>[number];
export type PickerTask = PickerTrade["tasks"][number];
type Choice = { trade: PickerTrade; task: PickerTask };
type TipTask = keyof (typeof messages)["UploadFlow"]["tips"]["task"];

type Step = { kind: "pick"; done: boolean } | ({ kind: "tips" } & Choice) | ({ kind: "record" } & Choice);

/**
 * The Fundi's upload flow on /fundi (#38): pick a Trade → Task and read its
 * Rubric (US-3.2), recording tips (US-3.3), then the Liveness code, consent
 * and the video (RecordStep). Unstyled for V1. Mount it only for a Fundi:
 * every query here throws for anyone else.
 */
export function UploadFlow() {
  const t = useTranslations("UploadFlow");
  const [step, setStep] = useState<Step>({ kind: "pick", done: false });

  return (
    <section className="flex flex-col gap-4" aria-labelledby="upload-flow">
      <h2 id="upload-flow" className="text-xl font-semibold">
        {t("title")}
      </h2>
      {step.kind === "pick" ? (
        <>
          {step.done ? (
            <p role="status" className="text-base">
              {t("done")}
            </p>
          ) : null}
          <TaskPicker onChoose={(choice) => setStep({ kind: "tips", ...choice })} />
        </>
      ) : step.kind === "tips" ? (
        <RecordingTips
          task={step.task}
          onBack={() => setStep({ kind: "pick", done: false })}
          onNext={() => setStep({ ...step, kind: "record" })}
        />
      ) : (
        <RecordStep
          trade={step.trade}
          task={step.task}
          onBack={() => setStep({ ...step, kind: "tips" })}
          onDone={() => setStep({ kind: "pick", done: true })}
        />
      )}
    </section>
  );
}

function TaskPicker({ onChoose }: { onChoose: (choice: Choice) => void }) {
  const t = useTranslations("UploadFlow");
  const names = useCatalogueNames();
  const picker = useQuery(api.trades.uploadPicker, {});

  if (picker === undefined) return <p className="text-base text-foreground/75">{t("loading")}</p>;
  if (picker.length === 0) return <p className="text-base text-foreground/75">{t("empty")}</p>;

  return (
    <>
      <p className="text-base text-foreground/75">{t("pick.intro")}</p>
      <ul className="flex flex-col gap-6">
        {picker.map((trade) => (
          <li key={trade.slug} className="flex flex-col gap-3 rounded border border-line p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-lg font-semibold">{names.trade(trade.slug, trade.name)}</h3>
              {trade.onProfile ? (
                <span data-testid="on-profile" className="text-sm text-foreground/75">
                  {t("pick.onProfile")}
                </span>
              ) : null}
            </div>
            {trade.tasks.map((task) => {
              const taskName = names.task(task.slug, task.name);
              return (
                <div key={task.slug} className="flex flex-col gap-3">
                  <p className="text-base">{t("pick.task", { task: taskName })}</p>
                  <p className={LABEL}>{t("pick.checklist")}</p>
                  <ul className="flex list-disc flex-col gap-2 pl-5">
                    {task.items.map((item) => (
                      <li key={item.id} data-testid="rubric-item" className="text-base">
                        {item.safety ? (
                          <>
                            <strong className="font-semibold">{t("pick.safety")}</strong>{" "}
                          </>
                        ) : null}
                        {names.rubricItem(task.slug, item.id, item.text)}
                      </li>
                    ))}
                  </ul>
                  {task.items.some((item) => item.safety) ? (
                    <p className="text-sm text-foreground/75">{t("pick.safetyNote")}</p>
                  ) : null}
                  <button type="button" className={PRIMARY_PILL} onClick={() => onChoose({ trade, task })}>
                    {t("pick.choose", { task: taskName })}
                  </button>
                </div>
              );
            })}
          </li>
        ))}
      </ul>
    </>
  );
}

function RecordingTips({ task, onBack, onNext }: { task: PickerTask; onBack: () => void; onNext: () => void }) {
  const t = useTranslations("UploadFlow");
  // Tips for this Task first, when it has any; a Task added later gets the common tips.
  const taskKey = Object.hasOwn(TASK_TIP_KEYS, task.slug) ? (task.slug as TipTask) : null;
  const taskTips = taskKey ? TASK_TIP_KEYS[taskKey] : [];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">{t("tips.title")}</h3>
      <p className="text-base text-foreground/75">{t("tips.intro")}</p>
      <ul className="flex list-disc flex-col gap-2 pl-5">
        {taskTips.map((key) => (
          <li key={key} className="text-base font-medium">
            {t(`tips.task.${taskKey}.${key}` as never)}
          </li>
        ))}
        {COMMON_TIP_KEYS.map((key) => (
          <li key={key} className="text-base">
            {t(`tips.common.${key}`)}
          </li>
        ))}
      </ul>
      <StepNav backLabel={t("back")} onBack={onBack} nextLabel={t("tips.next")} onNext={onNext} />
    </div>
  );
}

const COMMON_TIP_KEYS = ["light", "length", "frame", "steady", "code", "safety"] as const satisfies readonly (keyof (typeof messages)["UploadFlow"]["tips"]["common"])[];

const TASK_TIP_KEYS: { [K in TipTask]: readonly (keyof (typeof messages)["UploadFlow"]["tips"]["task"][K])[] } = {
  "13a-socket": ["people", "close"],
  cornrows: ["face", "ask"],
};

export function StepNav({
  backLabel,
  onBack,
  nextLabel,
  onNext,
}: {
  backLabel: string;
  onBack: () => void;
  nextLabel?: string;
  onNext?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {nextLabel && onNext ? (
        <button type="button" className={PRIMARY_PILL} onClick={onNext}>
          {nextLabel}
        </button>
      ) : null}
      <button type="button" className={SECONDARY_PILL} onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}
