import { jest } from "@jest/globals";
import { LocalReinstateGoalGateway } from "../../../../../src/application/context/goals/reinstate/LocalReinstateGoalGateway";
import { ReinstateGoalCommandHandler } from "../../../../../src/application/context/goals/reinstate/ReinstateGoalCommandHandler";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("LocalReinstateGoalGateway", () => {
  it("executes the command and exposes only operation status", async () => {
    const commandHandler: jest.Mocked<Pick<ReinstateGoalCommandHandler, "execute">> = {
      execute: jest.fn<ReinstateGoalCommandHandler["execute"]>().mockResolvedValue({ status: GoalStatus.TODO }),
    };
    const gateway = new LocalReinstateGoalGateway(commandHandler as ReinstateGoalCommandHandler);

    const response = await gateway.reinstateGoal({ goalId: "goal_123" });

    expect(commandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
    expect(response).toEqual({ status: GoalStatus.TODO });
    expect(Object.keys(response)).toEqual(["status"]);
  });
});
