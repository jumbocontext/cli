import { CanSubmitRule } from "../../../../../src/domain/goals/rules/CanSubmitRule";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalState } from "../../../../../src/domain/goals/Goal";

describe("CanSubmitRule", () => {
  const rule = new CanSubmitRule();

  const makeState = (status: string): GoalState => ({
    id: "goal_123",
    title: "Test Goal",
    objective: "Test",
    successCriteria: ["Criterion"],
    scopeIn: [],
    scopeOut: [],
    status: status as unknown as GoalState["status"],
    version: 2,
    progress: [],
  });

  it("should allow submission from DOING status", () => {
    const result = rule.validate(makeState(GoalStatus.DOING));
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject submission from TODO status", () => {
    const result = rule.validate(makeState(GoalStatus.TODO));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal in defined status");
  });

  it("should reject submission from REFINED status", () => {
    const result = rule.validate(makeState(GoalStatus.REFINED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal in refined status");
  });

  it("should reject submission from BLOCKED status", () => {
    const result = rule.validate(makeState(GoalStatus.BLOCKED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal in blocked status");
  });

  it("should reject submission from INREVIEW status", () => {
    const result = rule.validate(makeState(GoalStatus.INREVIEW));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal in in-review status");
  });

  it("should reject submission from SUBMITTED status", () => {
    const result = rule.validate(makeState(GoalStatus.SUBMITTED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal in submitted status");
  });
});
