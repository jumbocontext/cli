import { GoalCommitOutputBuilder } from "../../../../../../../src/presentation/cli/commands/goals/commit/GoalCommitOutputBuilder";

describe("GoalCommitOutputBuilder", () => {
  let builder: GoalCommitOutputBuilder;

  beforeEach(() => {
    builder = new GoalCommitOutputBuilder();
  });

  describe("buildSuccess", () => {
    it("should build guidance output by default (no continue flag)", () => {
      const output = builder.buildSuccess("goal_123", "refined");
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Committed");
      expect(text).toContain("Goal refinement committed");
      expect(text).toContain("jumbo goal start --id goal_123");
      expect(text).not.toContain("@LLM:");
    });

    it("should build directive output when continue flag is true", () => {
      const output = builder.buildSuccess("goal_123", "refined", true);
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Committed");
      expect(text).toContain("@LLM:");
      expect(text).toContain("jumbo goal start --id goal_123");
      expect(text).not.toContain("[Next Phase]");
    });
  });

  it("should build goal not found error output", () => {
    const output = builder.buildGoalNotFoundError("goal_123");
    const text = output.toHumanReadable();

    expect(text).toContain("Goal not found");
    expect(text).toContain("goal_123");
  });

  it("should build failure error output", () => {
    const output = builder.buildFailureError("Something went wrong");
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to commit goal");
    expect(text).toContain("Something went wrong");
  });

  it("should build failure error output from Error object", () => {
    const output = builder.buildFailureError(new Error("Domain error"));
    const text = output.toHumanReadable();

    expect(text).toContain("Failed to commit goal");
    expect(text).toContain("Domain error");
  });
});
