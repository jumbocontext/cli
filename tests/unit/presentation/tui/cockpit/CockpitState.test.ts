import { describe, expect, it } from "@jest/globals";
import { ProjectLifecycle } from "../../../../../src/domain/project/Constants.js";
import { CockpitPlaceholderState } from "../../../../../src/presentation/tui/cockpit/CockpitState.js";

describe("CockpitState", () => {
  it("uses the uninitialized lifecycle as the placeholder state", () => {
    expect(CockpitPlaceholderState).toBe(ProjectLifecycle.UNINITIALIZED);
  });
});
