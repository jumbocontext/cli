import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalReinstateOutputBuilder } from "../../../../../../src/presentation/cli/commands/goals/reinstate/GoalReinstateOutputBuilder";

describe("GoalReinstateOutputBuilder", () => {
  it("exposes only operation status on success", () => {
    const output = new GoalReinstateOutputBuilder().buildSuccess({ status: GoalStatus.TODO });

    expect(output.toHumanReadable()).toContain("Goal defined");
    expect(output.toHumanReadable()).not.toContain("goal_");
    expect(output.getSections().find((section) => section.type === "data")?.content)
      .toEqual({ status: GoalStatus.TODO });
  });

  it("keeps failure copy and details inside the builder", () => {
    const output = new GoalReinstateOutputBuilder().buildFailureError(new Error("wrong state"));

    expect(output.toHumanReadable()).toContain("Failed to reinstate goal: wrong state");
    expect(output.getSections().find((section) => section.type === "data")?.content)
      .toEqual({ error: "Failed to reinstate goal", details: "wrong state" });
  });
});
