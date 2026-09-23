import { jest } from "@jest/globals";
import { GoalPostponedEventHandler } from "../../../../../src/application/context/goals/postpone/GoalPostponedEventHandler";
import { IGoalPostponedProjector } from "../../../../../src/application/context/goals/postpone/IGoalPostponedProjector";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalPostponedEvent } from "../../../../../src/domain/goals/postpone/GoalPostponedEvent";

describe("GoalPostponedEventHandler", () => {
  it("delegates the event to the postponed projector", async () => {
    const projector: jest.Mocked<IGoalPostponedProjector> = {
      applyGoalPostponed: jest.fn<IGoalPostponedProjector["applyGoalPostponed"]>().mockResolvedValue(undefined),
    };
    const event: GoalPostponedEvent = {
      type: GoalEventType.POSTPONED,
      aggregateId: "goal_123",
      version: 2,
      timestamp: "2026-09-11T10:00:00.000Z",
      payload: { status: GoalStatus.POSTPONED },
    };

    await new GoalPostponedEventHandler(projector).handle(event);

    expect(projector.applyGoalPostponed).toHaveBeenCalledWith(event);
  });
});
