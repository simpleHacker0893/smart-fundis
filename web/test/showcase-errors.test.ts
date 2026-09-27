import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { showcaseSaveErrorKey } from "@/lib/showcase-errors";

// fundiProfiles.setShowcaseLinks throws ConvexError({ code: "invalid",
// fields: { youtube?, tiktok? } }) with the parser's slot errors. The /fundi
// form maps each to its Showcase.errors message, and anything else to "save".

describe("showcaseSaveErrorKey (US-3.8)", () => {
  it("maps the slot's own field error from the server", () => {
    const invalid = (fields: Record<string, string>) => new ConvexError({ code: "invalid", fields });
    expect(showcaseSaveErrorKey(invalid({ tiktok: "tiktok_short" }), "tiktok")).toBe("tiktok_short");
    expect(showcaseSaveErrorKey(invalid({ youtube: "wrong_site" }), "youtube")).toBe("wrong_site");
    expect(showcaseSaveErrorKey(invalid({ youtube: "unsupported" }), "youtube")).toBe("unsupported");
  });

  it("says 'save' for another slot's error, an unknown code, or any other failure", () => {
    expect(showcaseSaveErrorKey(new ConvexError({ code: "invalid", fields: { tiktok: "unsupported" } }), "youtube")).toBe("save");
    expect(showcaseSaveErrorKey(new ConvexError({ code: "invalid", fields: { youtube: "toString" } }), "youtube")).toBe("save");
    expect(showcaseSaveErrorKey(new ConvexError({ code: "forbidden" }), "youtube")).toBe("save");
    expect(showcaseSaveErrorKey(new Error("offline"), "tiktok")).toBe("save");
  });

  it("never shows 'empty' or 'tiktok_short' in the YouTube slot from the server", () => {
    expect(showcaseSaveErrorKey(new ConvexError({ code: "invalid", fields: { youtube: "tiktok_short" } }), "youtube")).toBe("save");
  });
});
