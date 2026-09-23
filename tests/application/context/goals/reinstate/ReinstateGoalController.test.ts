import { jest } from "@jest/globals";
import { IReinstateGoalGateway } from "../../../../../src/application/context/goals/reinstate/IReinstateGoalGateway";
import { ReinstateGoalController } from "../../../../../src/application/context/goals/reinstate/ReinstateGoalController";

describe("ReinstateGoalController", () => {
  it("delegates the typed request and returns the gateway response", async () => {
    const gateway: jest.Mocked<IReinstateGoalGateway> = {
      reinstateGoal: jest.fn<IReinstateGoalGateway["reinstateGoal"]>().mockResolvedValue({ status: "defined" }),
    };
    const controller = new ReinstateGoalController(gateway);

    await expect(controller.handle({ goalId: "goal_123" })).resolves.toEqual({ status: "defined" });
    expect(gateway.reinstateGoal).toHaveBeenCalledWith({ goalId: "goal_123" });
  });
});
