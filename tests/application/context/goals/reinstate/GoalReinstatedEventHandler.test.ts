import { jest } from "@jest/globals";
import { GoalReinstatedEventHandler } from "../../../../../src/application/context/goals/reinstate/GoalReinstatedEventHandler";
import { IGoalReinstatedProjector } from "../../../../../src/application/context/goals/reinstate/IGoalReinstatedProjector";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalReinstatedEvent } from "../../../../../src/domain/goals/reinstate/GoalReinstatedEvent";

describe("GoalReinstatedEventHandler", () => {
  it("delegates the event to the reinstated projector", async () => {
    const projector: jest.Mocked<IGoalReinstatedProjector> = {
      applyGoalReinstated: jest.fn<IGoalReinstatedProjector["applyGoalReinstated"]>().mockResolvedValue(undefined),
    };
    const event: GoalReinstatedEvent = {
      type: GoalEventType.REINSTATED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: "2026-09-11T11:00:00.000Z",
      payload: { status: GoalStatus.TODO },
    };

    await new GoalReinstatedEventHandler(projector).handle(event);

    expect(projector.applyGoalReinstated).toHaveBeenCalledWith(event);
  });
});
