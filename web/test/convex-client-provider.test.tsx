import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ConvexProviderWithClerk and StoreUserOnAuth are replaced with markers, so the
// test can see whether the provider (and the store hook) were rendered.
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({}) }));
vi.mock("convex/react", () => ({
  ConvexReactClient: class {
    constructor(public url: string) {}
  },
}));
vi.mock("convex/react-clerk", () => ({
  ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) => (
    <section data-convex="provider">{children}</section>
  ),
}));
vi.mock("@/components/store-user-on-auth", () => ({
  StoreUserOnAuth: () => <i data-convex="store-user" />,
}));

const saved = process.env.NEXT_PUBLIC_CONVEX_URL;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (saved === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
  else process.env.NEXT_PUBLIC_CONVEX_URL = saved;
  vi.restoreAllMocks();
});

async function render() {
  const { ConvexClientProvider } = await import("@/components/convex-client-provider");
  return renderToStaticMarkup(
    <ConvexClientProvider>
      <p>child</p>
    </ConvexClientProvider>,
  );
}

describe("ConvexClientProvider", () => {
  it("wraps children in the Convex provider and runs the store hook when the URL is set", async () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    const html = await render();

    expect(html).toContain('data-convex="provider"');
    expect(html).toContain('data-convex="store-user"');
    expect(html).toContain("<p>child</p>");
  });

  it("renders children without Convex, and without the store hook, when the URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = await render();

    expect(html).toBe("<p>child</p>");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("tells children whether Convex is available (true with the URL, false without)", async () => {
    async function probe() {
      const { ConvexClientProvider } = await import("@/components/convex-client-provider");
      const { useConvexAvailable } = await import("@/components/convex-available");
      function Probe() {
        return <b>{String(useConvexAvailable())}</b>;
      }
      return renderToStaticMarkup(
        <ConvexClientProvider>
          <Probe />
        </ConvexClientProvider>,
      );
    }
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
    expect(await probe()).toContain("<b>true</b>");

    vi.resetModules();
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await probe()).toBe("<b>false</b>");
  });

  it("warns only once however often it renders without the URL", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { ConvexClientProvider } = await import("@/components/convex-client-provider");
    for (let i = 0; i < 3; i++) {
      renderToStaticMarkup(<ConvexClientProvider>{null}</ConvexClientProvider>);
    }
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
