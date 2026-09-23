import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalPostponeOutputBuilder } from "../../../../../../src/presentation/cli/commands/goals/postpone/GoalPostponeOutputBuilder";

describe("GoalPostponeOutputBuilder", () => {
  it("exposes only operation status on success", () => {
    const output = new GoalPostponeOutputBuilder().buildSuccess({ status: GoalStatus.POSTPONED });

    expect(output.toHumanReadable()).toContain("Goal postponed");
    expect(output.toHumanReadable()).not.toContain("goal_");
    expect(output.getSections().find((section) => section.type === "data")?.content)
      .toEqual({ status: GoalStatus.POSTPONED });
  });

  it("keeps failure copy and details inside the builder", () => {
    const output = new GoalPostponeOutputBuilder().buildFailureError(new Error("wrong state"));

    expect(output.toHumanReadable()).toContain("Failed to postpone goal: wrong state");
    expect(output.getSections().find((section) => section.type === "data")?.content)
      .toEqual({ error: "Failed to postpone goal", details: "wrong state" });
  });
});
