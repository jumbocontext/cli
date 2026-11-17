import { GoalCloseOutputBuilder } from "../../../../../../../src/presentation/cli/commands/goals/close/GoalCloseOutputBuilder";
import { CloseGoalResponse } from "../../../../../../../src/application/context/goals/close/CloseGoalResponse";

describe("GoalCloseOutputBuilder", () => {
  let builder: GoalCloseOutputBuilder;

  beforeEach(() => {
    builder = new GoalCloseOutputBuilder();
  });

  describe("buildSuccess", () => {
    const response: CloseGoalResponse = {
      goalId: "goal_123",
      objective: "Implement authentication",
      status: "done",
    };

    it("should build output without next goal", () => {
      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Closed");
      expect(text).toContain("goal_123");
      expect(text).toContain("Implement authentication");
      expect(text).toContain("done");
    });

    it("should build guidance output with next goal by default (no continue flag)", () => {
      const responseWithNext: CloseGoalResponse = {
        ...response,
        nextGoal: {
          goalId: "goal_456",
          objective: "Add logging",
          status: "refined",
        },
      };

      const output = builder.buildSuccess(responseWithNext);
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Closed");
      expect(text).toContain("Next Goal");
      expect(text).toContain("goal_456");
      expect(text).toContain("➤");
      expect(text).toContain("To start:");
      expect(text).toContain("jumbo goal start --id goal_456");
      expect(text).not.toContain("Start the next goal immediately");
    });

    it("should build directive output with next goal when continue flag is true", () => {
      const responseWithNext: CloseGoalResponse = {
        ...response,
        nextGoal: {
          goalId: "goal_456",
          objective: "Add logging",
          status: "refined",
        },
      };

      const output = builder.buildSuccess(responseWithNext, true);
      const text = output.toHumanReadable();

      expect(text).toContain("Start the next goal immediately");
      expect(text).toContain("jumbo goal start --id goal_456");
      expect(text).not.toContain("➤");
    });
  });

  it("should build failure error output", () => {
    const output = builder.buildFailureError("Something went wrong");
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to close goal");
    expect(text).toContain("Something went wrong");
  });

  it("should build failure error output from Error object", () => {
    const output = builder.buildFailureError(new Error("Domain error"));
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to close goal");
    expect(text).toContain("Domain error");
  });
});
