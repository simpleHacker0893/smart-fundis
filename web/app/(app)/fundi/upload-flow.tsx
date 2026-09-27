"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { LABEL } from "@/components/ui/field-label";
import { SECTION_LABEL } from "@/components/ui/app-type";
import { SECONDARY_PILL } from "@/components/ui/pill";
import { useCatalogueNames } from "@/components/use-catalogue-names";
import type messages from "@/messages/en.json";
import { RecordStep } from "./record-step";

export type PickerTrade = FunctionReturnType<typeof api.trades.uploadPicker>[number];
export type PickerTask = PickerTrade["tasks"][number];
type Choice = { trade: PickerTrade; task: PickerTask };
type TipTask = keyof (typeof messages)["UploadFlow"]["tips"]["task"];

type Step = { kind: "pick"; done: boolean } | ({ kind: "tips" } & Choice) | ({ kind: "record" } & Choice);

/**
 * The Fundi's upload flow on /fundi/record (#38, restyled in app mode for
 * #67, prompt 26 frames 8–10): "1 PICK A TASK" with its Rubric (US-3.2) and
 * the recording tips (US-3.3), then RecordStep's "2 YOUR CODE", "3 RECORD"
 * and "4 CONSENT AND UPLOAD". Every action here is outlined except Upload,
 * the page's one amber fill on mobile. Mount it only for a Fundi: every
 * query here throws for anyone else.
 */
export function UploadFlow() {
  const t = useTranslations("UploadFlow");
  const [step, setStep] = useState<Step>({ kind: "pick", done: false });

  return (
    <section className="flex flex-col gap-4" aria-label={t("title")}>
      {step.kind !== "record" ? <h2 className={SECTION_LABEL}>{t("steps.pick")}</h2> : null}
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

  if (picker === undefined) return <p className="text-base text-dim">{t("loading")}</p>;
  if (picker.length === 0) return <p className="text-base text-dim">{t("empty")}</p>;

  return (
    <>
      <p className="text-base text-dim">{t("pick.intro")}</p>
      <ul className="flex flex-col gap-6">
        {picker.map((trade) => (
          <li key={trade.slug} className="flex flex-col gap-3 rounded border border-line p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-base font-semibold">{names.trade(trade.slug, trade.name)}</h3>
              {trade.onProfile ? (
                <span data-testid="on-profile" className="font-mono text-xs tracking-[0.08em] text-dim uppercase">
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
                    <p className="text-base text-dim">{t("pick.safetyNote")}</p>
                  ) : null}
                  <button type="button" className={SECONDARY_PILL} onClick={() => onChoose({ trade, task })}>
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
      <h3 className="text-base font-semibold">{t("tips.title")}</h3>
      <p className="text-base text-dim">{t("tips.intro")}</p>
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
        <button type="button" className={SECONDARY_PILL} onClick={onNext}>
          {nextLabel}
        </button>
      ) : null}
      <button type="button" className={SECONDARY_PILL} onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}
