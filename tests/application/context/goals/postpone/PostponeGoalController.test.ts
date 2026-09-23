import { jest } from "@jest/globals";
import { IPostponeGoalGateway } from "../../../../../src/application/context/goals/postpone/IPostponeGoalGateway";
import { PostponeGoalController } from "../../../../../src/application/context/goals/postpone/PostponeGoalController";

describe("PostponeGoalController", () => {
  it("delegates the typed request and returns the gateway response", async () => {
    const gateway: jest.Mocked<IPostponeGoalGateway> = {
      postponeGoal: jest.fn<IPostponeGoalGateway["postponeGoal"]>().mockResolvedValue({ status: "postponed" }),
    };
    const controller = new PostponeGoalController(gateway);

    await expect(controller.handle({ goalId: "goal_123" })).resolves.toEqual({ status: "postponed" });
    expect(gateway.postponeGoal).toHaveBeenCalledWith({ goalId: "goal_123" });
  });
});
