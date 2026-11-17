import { describe, it, expect } from "@jest/globals";
import {
  SessionInstructionSignal,
  SessionInstructionSignalValue,
} from "../../../../../src/application/context/sessions/SessionInstructionSignal.js";

describe("SessionInstructionSignal", () => {
  it("should define all expected signal constants", () => {
    expect(SessionInstructionSignal.BROWNFIELD_ONBOARDING).toBe("brownfield-onboarding");
    expect(SessionInstructionSignal.PAUSED_GOALS_RESUME).toBe("paused-goals-resume");
    expect(SessionInstructionSignal.GOAL_SELECTION_PROMPT).toBe("goal-selection-prompt");
    expect(SessionInstructionSignal.ARCHITECTURE_DEPRECATED).toBe("architecture-deprecated");
  });

  it("should have exactly four signals", () => {
    const keys = Object.keys(SessionInstructionSignal);
    expect(keys).toHaveLength(4);
  });

  it("should not define primitive-gaps-detected", () => {
    expect(Object.keys(SessionInstructionSignal)).not.toContain("PRIMITIVE_GAPS_DETECTED");
    expect(Object.values(SessionInstructionSignal)).not.toContain("primitive-gaps-detected");
  });

  it("should be usable as a type via SessionInstructionSignalValue", () => {
    const signal: SessionInstructionSignalValue = SessionInstructionSignal.BROWNFIELD_ONBOARDING;
    expect(signal).toBe("brownfield-onboarding");
  });
});
