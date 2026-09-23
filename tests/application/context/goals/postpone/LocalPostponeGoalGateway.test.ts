import { jest } from "@jest/globals";
import { LocalPostponeGoalGateway } from "../../../../../src/application/context/goals/postpone/LocalPostponeGoalGateway";
import { PostponeGoalCommandHandler } from "../../../../../src/application/context/goals/postpone/PostponeGoalCommandHandler";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("LocalPostponeGoalGateway", () => {
  it("executes the command and exposes only operation status", async () => {
    const commandHandler: jest.Mocked<Pick<PostponeGoalCommandHandler, "execute">> = {
      execute: jest.fn<PostponeGoalCommandHandler["execute"]>().mockResolvedValue({ status: GoalStatus.POSTPONED }),
    };
    const gateway = new LocalPostponeGoalGateway(commandHandler as PostponeGoalCommandHandler);

    const response = await gateway.postponeGoal({ goalId: "goal_123" });

    expect(commandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
    expect(response).toEqual({ status: GoalStatus.POSTPONED });
    expect(Object.keys(response)).toEqual(["status"]);
  });
});
