import { CanCloseRule } from "../../../../../src/domain/goals/rules/CanCloseRule";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalState } from "../../../../../src/domain/goals/Goal";

describe("CanCloseRule", () => {
  const rule = new CanCloseRule();

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

  it("should allow close from CODIFYING status", () => {
    const result = rule.validate(makeState(GoalStatus.CODIFYING));
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject close from DONE status (already done)", () => {
    const result = rule.validate(makeState(GoalStatus.DONE));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("already done");
  });

  it("should reject close from QUALIFIED status", () => {
    const result = rule.validate(makeState(GoalStatus.QUALIFIED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot close goal in approved status");
  });

  it("should reject close from DOING status", () => {
    const result = rule.validate(makeState(GoalStatus.DOING));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot close goal in doing status");
  });

  it("should reject close from TODO status", () => {
    const result = rule.validate(makeState(GoalStatus.TODO));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot close goal in defined status");
  });

  it("should reject close from REFINED status", () => {
    const result = rule.validate(makeState(GoalStatus.REFINED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot close goal in refined status");
  });

  it("should reject close from SUBMITTED status", () => {
    const result = rule.validate(makeState(GoalStatus.SUBMITTED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot close goal in submitted status");
  });
});
