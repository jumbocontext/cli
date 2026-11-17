import { GoalRejectOutputBuilder } from "../../../../../../../src/presentation/cli/commands/goals/reject/GoalRejectOutputBuilder";
import { RejectGoalResponse } from "../../../../../../../src/application/context/goals/reject/RejectGoalResponse";

describe("GoalRejectOutputBuilder", () => {
  let builder: GoalRejectOutputBuilder;

  beforeEach(() => {
    builder = new GoalRejectOutputBuilder();
  });

  describe("buildSuccess", () => {
    const response: RejectGoalResponse = {
      goalId: "goal_123",
      status: "rejected",
      objective: "Implement authentication",
      reviewIssues: "Missing error handling in API endpoint",
    };

    it("should build guidance output by default (no continue flag)", () => {
      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Rejected");
      expect(text).toContain("goal_123");
      expect(text).toContain("Implement authentication");
      expect(text).toContain("rejected");
      expect(text).toContain("Missing error handling in API endpoint");
      expect(text).toContain("➤");
      expect(text).toContain("To restart:");
      expect(text).toContain("jumbo goal start --id goal_123");
      expect(text).not.toContain("Address the review issues");
    });

    it("should build directive output when continue flag is true", () => {
      const output = builder.buildSuccess(response, true);
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Rejected");
      expect(text).toContain("Address the review issues");
      expect(text).toContain("jumbo goal start --id goal_123");
      expect(text).not.toContain("➤");
    });

    it("should include next goal ID when present", () => {
      const responseWithNext: RejectGoalResponse = {
        ...response,
        nextGoalId: "goal_456",
      };

      const output = builder.buildSuccess(responseWithNext);
      const text = output.toHumanReadable();

      expect(text).toContain("goal_456");
    });
  });

  it("should build failure error output", () => {
    const output = builder.buildFailureError("Something went wrong");
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to reject goal");
    expect(text).toContain("Something went wrong");
  });

  it("should build failure error output from Error object", () => {
    const output = builder.buildFailureError(new Error("Domain error"));
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to reject goal");
    expect(text).toContain("Domain error");
  });
});
