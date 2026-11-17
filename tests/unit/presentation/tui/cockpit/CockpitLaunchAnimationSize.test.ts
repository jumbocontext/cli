import { describe, expect, it } from "@jest/globals";
import { getCockpitLaunchAnimationSize } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchAnimationSize.js";

describe("getCockpitLaunchAnimationSize", () => {
  it("floors terminal dimensions for launch animation rendering", () => {
    expect(getCockpitLaunchAnimationSize(80.9, 22.3)).toEqual({
      height: 22,
      width: 80,
    });
  });

  it("keeps launch animation dimensions renderable", () => {
    expect(getCockpitLaunchAnimationSize(0, -2)).toEqual({
      height: 1,
      width: 1,
    });
  });
});
