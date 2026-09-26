// @vitest-environment jsdom
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { CONSENT_VERSION, MAX_VIDEO_BYTES } from "@convex/lib/assessmentUpload";
import { defaultLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import { makeIsFromMessages } from "./copy-helpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = createTranslator({ locale: defaultLocale, messages: en, namespace: "UploadFlow" });

const PICKER = [
  {
    slug: "electrical",
    name: "Electrical",
    onProfile: true,
    tasks: [
      {
        slug: "13a-socket",
        name: "Install a 13A socket",
        rubricVersion: 1,
        clientOnCamera: false,
        items: [
          { id: "isolate", text: "server isolate", safety: true },
          { id: "faceplate", text: "server faceplate", safety: false },
        ],
      },
    ],
  },
  {
    slug: "hairdressing",
    name: "Hairdressing",
    onProfile: false,
    tasks: [
      {
        slug: "cornrows",
        name: "Cornrows",
        rubricVersion: 1,
        clientOnCamera: true,
        items: [{ id: "prep", text: "server prep", safety: false }],
      },
    ],
  },
];

/** listMine-style stand-in: a value the test can push to mounted hooks. */
function liveValue<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      for (const l of listeners) l();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test doubles take any arguments
type AnyMock = Mock<(...args: any[]) => any>;

const state = vi.hoisted(() => ({
  picker: undefined as unknown,
  newLivenessCode: undefined as unknown as AnyMock,
  generateUploadUrl: undefined as unknown as AnyMock,
  create: undefined as unknown as AnyMock,
  postVideo: undefined as unknown as AnyMock,
  live: undefined as unknown as { get: () => unknown; set: (v: unknown) => void; subscribe: (l: () => void) => () => void },
}));

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const { useSyncExternalStore } = await import("react");
  return {
    useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
      const name = getFunctionName(ref);
      const current = useSyncExternalStore(state.live.subscribe, state.live.get);
      if (args === "skip") return undefined;
      if (name === "trades:uploadPicker") return state.picker;
      if (name === "assessments:currentLivenessCode") return current;
      throw new Error(`unexpected query ${name}`);
    },
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
      const name = getFunctionName(ref);
      if (name === "assessments:newLivenessCode") return state.newLivenessCode;
      if (name === "assessments:generateUploadUrl") return state.generateUploadUrl;
      if (name === "assessments:create") return state.create;
      throw new Error(`unexpected mutation ${name}`);
    },
  };
});

vi.mock("@/lib/video-upload", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/video-upload")>();
  return { ...original, postVideo: (...args: unknown[]) => state.postVideo(...args) };
});

let container: HTMLDivElement;
let root: Root;
const HOUR = 60 * 60 * 1000;

beforeEach(() => {
  state.picker = PICKER;
  state.live = liveValue<unknown>(null);
  state.newLivenessCode = vi.fn(async () => {
    state.live.set({ code: "482", expiresAt: Date.now() + 2 * HOUR });
    return "482";
  });
  state.generateUploadUrl = vi.fn(async () => "https://upload.example/1");
  state.create = vi.fn(async () => ({ ok: true, assessmentId: "assessments_9" }));
  state.postVideo = vi.fn(async (_url: string, _file: Blob, onProgress: (p: number) => void) => {
    onProgress(40);
    onProgress(100);
    return "storage_1";
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});

async function render() {
  const { UploadFlow } = await import("@/app/(site)/fundi/upload-flow");
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale={defaultLocale} messages={en} timeZone="Africa/Nairobi">
        <UploadFlow />
      </NextIntlClientProvider>,
    );
  });
}

function button(name: string): HTMLButtonElement {
  const found = [...container.querySelectorAll("button")].find((b) => b.textContent === name);
  if (!found) throw new Error(`no button "${name}"`);
  return found;
}
const hasButton = (name: string) => [...container.querySelectorAll("button")].some((b) => b.textContent === name);

async function tap(name: string) {
  await act(async () => button(name).click());
}

function control(label: string): HTMLInputElement {
  const el = [...container.querySelectorAll("label")].find((l) => l.textContent?.trim() === label);
  if (!el) throw new Error(`no label "${label}"`);
  const input = el.htmlFor ? container.querySelector<HTMLInputElement>(`#${CSS.escape(el.htmlFor)}`) : el.querySelector("input");
  if (!input) throw new Error(`no control for "${label}"`);
  return input;
}

async function toRecordStep(task = en.Rubrics["13a-socket"].name) {
  await render();
  await tap(t("pick.choose", { task }));
  await tap(t("tips.next"));
}

async function chooseFile(file: { name: string; size: number; type: string }, label = t("video.choose")) {
  const input = control(label);
  const blob = new File(["x"], file.name, { type: file.type });
  Object.defineProperty(blob, "size", { value: file.size });
  Object.defineProperty(input, "files", { value: [blob], configurable: true });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
  return blob;
}

async function tick(label: string) {
  await act(async () => control(label).click());
}

const alertText = () => container.querySelector('[role="alert"]')?.textContent ?? null;

describe("the Trade → Task picker (US-3.2)", () => {
  it("shows a loading line, then an empty line when no Trade is Verify now", async () => {
    state.picker = undefined;
    await render();
    expect(container.textContent).toContain(t("loading"));
    state.picker = [];
    await render();
    expect(container.textContent).toContain(t("empty"));
  });

  it("lists each Verify-now Trade with its Task and the Rubric checklist in plain words, safety items marked", async () => {
    await render();
    const text = container.textContent ?? "";
    expect(text).toContain(en.TradeCatalogue.electrical.name);
    expect(text).toContain(en.TradeCatalogue.hairdressing.name);
    expect(text).toContain(t("pick.task", { task: en.Rubrics["13a-socket"].name }));
    expect(text).toContain(en.Rubrics["13a-socket"].items.isolate);
    expect(text).toContain(en.Rubrics.cornrows.items.prep);
    // Only the Trade on the profile is marked.
    expect(container.querySelectorAll('[data-testid="on-profile"]')).toHaveLength(1);
    const items = [...container.querySelectorAll('[data-testid="rubric-item"]')];
    const isolate = items.find((li) => li.textContent?.includes(en.Rubrics["13a-socket"].items.isolate));
    const faceplate = items.find((li) => li.textContent?.includes(en.Rubrics["13a-socket"].items.faceplate));
    expect(isolate?.textContent).toContain(t("pick.safety"));
    expect(faceplate?.textContent).not.toContain(t("pick.safety"));
  });

  it("falls back to the server's text for an item en.json does not know", async () => {
    state.picker = [{ ...PICKER[0], tasks: [{ ...PICKER[0].tasks[0], items: [{ id: "new_item", text: "server new", safety: false }] }] }];
    await render();
    expect(container.textContent).toContain("server new");
  });
});

describe("recording tips (US-3.3)", () => {
  it("shows the common tips and the 13A socket's: keep other people out of the frame", async () => {
    await render();
    await tap(t("pick.choose", { task: en.Rubrics["13a-socket"].name }));
    const text = container.textContent ?? "";
    expect(container.querySelector("h3")?.textContent).toBe(t("tips.title"));
    for (const tip of Object.values(en.UploadFlow.tips.common)) expect(text).toContain(tip);
    expect(text).toContain(t("tips.task.13a-socket.people"));
    expect(text).not.toContain(t("tips.task.cornrows.face"));
    // The tips come before the code: no code is issued yet.
    expect(state.newLivenessCode).not.toHaveBeenCalled();
  });

  it("tells a hairdresser to keep the client's face out of the frame", async () => {
    await render();
    await tap(t("pick.choose", { task: en.Rubrics.cornrows.name }));
    expect(container.textContent).toContain("Film the head from the back or top. Keep the client's face out of the frame.");
  });

  it("goes back to the picker", async () => {
    await render();
    await tap(t("pick.choose", { task: en.Rubrics.cornrows.name }));
    await tap(t("back"));
    expect(hasButton(t("pick.choose", { task: en.Rubrics.cornrows.name }))).toBe(true);
  });
});

describe("the Liveness code (US-3.4)", () => {
  it("issues a new code when none is pending, and shows it large", async () => {
    await toRecordStep();
    expect(state.newLivenessCode).toHaveBeenCalledTimes(1);
    const code = container.querySelector('[data-testid="liveness-code"]');
    expect(code?.textContent).toBe("482");
    expect(code?.getAttribute("aria-label")).toBe(t("code.label", { code: "4 8 2" }));
    expect(code?.className).toMatch(/text-(6|7|8|9)xl/);
    expect(container.textContent).toContain(t("code.instructions"));
  });

  it("shows the pending code again after a reload instead of issuing another", async () => {
    state.live.set({ code: "073", expiresAt: Date.now() + HOUR });
    await toRecordStep();
    expect(state.newLivenessCode).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="liveness-code"]')?.textContent).toBe("073");
  });

  it("issues a new code when the pending one has expired", async () => {
    state.live.set({ code: "073", expiresAt: Date.now() - 1 });
    await toRecordStep();
    expect(state.newLivenessCode).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="liveness-code"]')?.textContent).toBe("482");
  });

  it("says so, with a retry, when a code cannot be issued", async () => {
    state.newLivenessCode.mockRejectedValueOnce(new Error("offline"));
    await toRecordStep();
    expect(alertText()).toBe(t("code.error"));
    await tap(t("code.retry"));
    expect(state.newLivenessCode).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[data-testid="liveness-code"]')?.textContent).toBe("482");
    expect(alertText()).toBeNull();
  });
});

describe("the verification consent (US-3.7, spec §7)", () => {
  it("covers who sees the video, AI and expert review, what becomes public, deletion and no AI training", async () => {
    await toRecordStep();
    const text = container.textContent ?? "";
    for (const point of Object.values(en.UploadFlow.consent.points)) expect(text).toContain(point);
    expect(text).not.toMatch(/certif/i);
  });

  it("keeps Upload disabled until the consent is ticked and a video is chosen", async () => {
    await toRecordStep();
    expect(button(t("upload")).disabled).toBe(true);
    expect(container.textContent).toContain(t("video.needConsent"));
    await chooseFile({ name: "socket.mp4", size: 1024, type: "video/mp4" });
    expect(button(t("upload")).disabled).toBe(true);
    await tick(t("consent.agree"));
    expect(control(t("consent.agree")).checked).toBe(true);
    expect(button(t("upload")).disabled).toBe(false);
    // The 13A socket has no client on camera: no second tick.
    expect(container.textContent).not.toContain(t("consent.client"));
  });

  it("asks a hairdresser to confirm the client agreed to be filmed before Upload is enabled", async () => {
    await toRecordStep(en.Rubrics.cornrows.name);
    await chooseFile({ name: "braids.mp4", size: 1024, type: "video/mp4" });
    await tick(t("consent.agree"));
    expect(button(t("upload")).disabled).toBe(true);
    await tick(t("consent.client"));
    expect(button(t("upload")).disabled).toBe(false);
  });
});

describe("recording or picking the video (US-3.5)", () => {
  it("offers the camera and a saved video, both video/* and labelled", async () => {
    await toRecordStep();
    const record = control(t("video.record"));
    const choose = control(t("video.choose"));
    expect(record.type).toBe("file");
    expect(record.accept).toBe("video/*");
    expect(record.getAttribute("capture")).toBe("environment");
    expect(choose.accept).toBe("video/*");
    expect(choose.hasAttribute("capture")).toBe(false);
  });

  it("names the chosen video", async () => {
    await toRecordStep();
    await chooseFile({ name: "socket.mp4", size: 1024, type: "video/mp4" }, t("video.record"));
    expect(container.textContent).toContain(t("video.chosen", { name: "socket.mp4" }));
  });

  it("refuses a file over 100 MB or not a video before uploading", async () => {
    await toRecordStep();
    await tick(t("consent.agree"));
    await chooseFile({ name: "big.mp4", size: MAX_VIDEO_BYTES + 1, type: "video/mp4" });
    expect(alertText()).toBe(t("errors.too_large"));
    expect(button(t("upload")).disabled).toBe(true);
    await chooseFile({ name: "photo.jpg", size: 10, type: "image/jpeg" });
    expect(alertText()).toBe(t("errors.wrong_type"));
    expect(button(t("upload")).disabled).toBe(true);
    expect(state.generateUploadUrl).not.toHaveBeenCalled();
  });
});

describe("uploading (US-3.6, US-3.7, US-3.9)", () => {
  it("uploads, shows progress, and creates the Assessment with the consent version and the code", async () => {
    let finish: (id: string) => void = () => {};
    state.postVideo.mockImplementationOnce(
      (_url: string, _file: Blob, onProgress: (p: number) => void) =>
        new Promise<string>((resolve) => {
          onProgress(40);
          finish = resolve;
        }),
    );
    await toRecordStep();
    const file = await chooseFile({ name: "socket.mp4", size: 1024, type: "video/mp4" });
    await tick(t("consent.agree"));
    await tap(t("upload"));

    const progress = container.querySelector("progress");
    expect(progress?.value).toBe(40);
    expect(progress?.max).toBe(100);
    expect(control(t("progress"))).toBe(progress);
    expect(container.textContent).toContain(t("uploading", { percent: 40 }));
    expect(button(t("upload")).disabled).toBe(true);

    await act(async () => finish("storage_1"));
    expect(state.postVideo).toHaveBeenCalledWith("https://upload.example/1", file, expect.any(Function));
    expect(state.create).toHaveBeenCalledWith({
      storageId: "storage_1",
      tradeSlug: "electrical",
      taskSlug: "13a-socket",
      consentVersion: CONSENT_VERSION,
      livenessCode: "482",
    });
    expect(CONSENT_VERSION).toBe("consent-v1");
    // Back to the picker, saying it worked.
    expect(container.querySelector('[role="status"]')?.textContent).toBe(t("done"));
  });

  it("sends clientConsent: true for a Task with a client on camera", async () => {
    await toRecordStep(en.Rubrics.cornrows.name);
    await chooseFile({ name: "braids.mp4", size: 1024, type: "video/mp4" });
    await tick(t("consent.agree"));
    await tick(t("consent.client"));
    await tap(t("upload"));
    expect(state.create).toHaveBeenCalledWith(
      expect.objectContaining({ tradeSlug: "hairdressing", taskSlug: "cornrows", clientConsent: true }),
    );
  });

  it("shows a clear error and a retry when the upload fails, then succeeds on retry", async () => {
    const { UploadError } = await import("@/lib/video-upload");
    state.postVideo.mockRejectedValueOnce(new UploadError("network"));
    await toRecordStep();
    await chooseFile({ name: "socket.mp4", size: 1024, type: "video/mp4" });
    await tick(t("consent.agree"));
    await tap(t("upload"));
    expect(alertText()).toBe(t("errors.network"));
    expect(state.create).not.toHaveBeenCalled();

    await tap(t("retry"));
    expect(state.generateUploadUrl).toHaveBeenCalledTimes(2);
    expect(state.create).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')?.textContent).toBe(t("done"));
  });

  it("shows the server's rejection as a message, and offers a new code for an expired one", async () => {
    state.create.mockResolvedValueOnce({ ok: false, code: "liveness_expired" });
    await toRecordStep();
    await chooseFile({ name: "socket.mp4", size: 1024, type: "video/mp4" });
    await tick(t("consent.agree"));
    await tap(t("upload"));
    expect(alertText()).toBe(t("errors.liveness_expired"));
    expect(hasButton(t("retry"))).toBe(false);

    state.newLivenessCode.mockImplementationOnce(async () => {
      state.live.set({ code: "915", expiresAt: Date.now() + 2 * HOUR });
      return "915";
    });
    await tap(t("newCode"));
    expect(container.querySelector('[data-testid="liveness-code"]')?.textContent).toBe("915");
    // The old video shows the old code: the Fundi must record again.
    expect(button(t("upload")).disabled).toBe(true);
    expect(alertText()).toBeNull();
  });

  it("shows a message for a rejection the Fundi must fix, with no retry", async () => {
    state.create.mockResolvedValueOnce({ ok: false, code: "wrong_type" });
    await toRecordStep();
    await chooseFile({ name: "socket.mp4", size: 1024, type: "video/mp4" });
    await tick(t("consent.agree"));
    await tap(t("upload"));
    expect(alertText()).toBe(t("errors.wrong_type"));
    expect(hasButton(t("retry"))).toBe(false);
    expect(hasButton(t("newCode"))).toBe(false);
  });
});

describe("copy and accessibility", () => {
  it("renders only copy from messages/en.json on every step", async () => {
    const isCopy = makeIsFromMessages(en);
    const check = () => {
      const texts = [...container.querySelectorAll("*")]
        .flatMap((el) => [...el.childNodes])
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? "")
        .filter(Boolean);
      for (const s of texts) expect(isCopy(s) || /^\d{3}$/.test(s), `hardcoded string: "${s}"`).toBe(true);
    };
    await render();
    check();
    await tap(t("pick.choose", { task: en.Rubrics.cornrows.name }));
    check();
    await tap(t("tips.next"));
    check();
  });

  it("gives every button and tick a 44 px or larger tap target", async () => {
    await toRecordStep(en.Rubrics.cornrows.name);
    for (const b of container.querySelectorAll("button")) expect(b.className, b.textContent ?? "").toMatch(/\b(h-12|min-h-12)\b/);
    for (const label of [t("video.record"), t("video.choose"), t("consent.agree"), t("consent.client")]) {
      const el = [...container.querySelectorAll("label")].find((l) => l.textContent?.trim() === label);
      expect(el?.className, label).toMatch(/\bmin-h-12\b/);
    }
  });
});
