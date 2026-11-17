import { CanCodifyRule } from "../../../../../src/domain/goals/rules/CanCodifyRule";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalState } from "../../../../../src/domain/goals/Goal";

describe("CanCodifyRule", () => {
  const rule = new CanCodifyRule();

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

  it("should allow codification from QUALIFIED status", () => {
    const result = rule.validate(makeState(GoalStatus.QUALIFIED));
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should allow codification from CODIFYING status (idempotent re-entry)", () => {
    const result = rule.validate(makeState(GoalStatus.CODIFYING));
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject codification from DONE status (already done)", () => {
    const result = rule.validate(makeState(GoalStatus.DONE));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("already done");
  });

  it("should reject codification from TODO status", () => {
    const result = rule.validate(makeState(GoalStatus.TODO));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot codify goal in defined status");
  });

  it("should reject codification from DOING status", () => {
    const result = rule.validate(makeState(GoalStatus.DOING));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot codify goal in doing status");
  });

  it("should reject codification from REFINED status", () => {
    const result = rule.validate(makeState(GoalStatus.REFINED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot codify goal in refined status");
  });

  it("should reject codification from SUBMITTED status", () => {
    const result = rule.validate(makeState(GoalStatus.SUBMITTED));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot codify goal in submitted status");
  });

  it("should reject codification from INREVIEW status", () => {
    const result = rule.validate(makeState(GoalStatus.INREVIEW));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot codify goal in in-review status");
  });
});
