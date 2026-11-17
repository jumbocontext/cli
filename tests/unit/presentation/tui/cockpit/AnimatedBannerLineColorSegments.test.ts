import { describe, expect, it } from "@jest/globals";
import { getAnimatedBannerLineColorSegments } from "../../../../../src/presentation/tui/animated-banner/LineColorSegments.js";
import { SemanticColors } from "../../../../../src/presentation/shared/DesignTokens.js";

describe("getAnimatedBannerLineColorSegments", () => {
  it("maps elephant shaded characters to inverse gradient segments", () => {
    expect(getAnimatedBannerLineColorSegments("▓▒█", "#123456")).toEqual([
      { text: "░  ", color: "#123456", inverse: true },
    ]);
  });

  it("keeps text block glyphs visually neutral", () => {
    expect(getAnimatedBannerLineColorSegments("██░", "#123456")).toEqual([
      { text: "██░", color: "#c8c8c8" },
    ]);
  });

  it("maps box drawing glyphs to the key badge color", () => {
    expect(getAnimatedBannerLineColorSegments("╭─╮", "#123456")).toEqual([
      { text: "╭─╮", color: SemanticColors.keyBadge },
    ]);
  });

  it("maps the banner tagline to muted text without swallowing adjacent text", () => {
    expect(
      getAnimatedBannerLineColorSegments(
        "Agent Context Orchestration!",
        "#123456",
      ),
    ).toEqual([
      { text: "Agent Context Orchestration", color: "#808080" },
      { text: "!" },
    ]);
  });
});
