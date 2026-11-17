import { GoalClosedEventHandler } from "../../../../../../src/application/context/goals/close/GoalClosedEventHandler";
import { IGoalClosedProjector } from "../../../../../../src/application/context/goals/close/IGoalClosedProjector";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalClosedEvent } from "../../../../../../src/domain/goals/close/GoalClosedEvent";
import { jest } from "@jest/globals";

describe("GoalClosedEventHandler", () => {
  let projector: jest.Mocked<IGoalClosedProjector>;
  let handler: GoalClosedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalClosed: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GoalClosedEventHandler(projector);
  });

  it("should delegate to projector with typed event", async () => {
    const event: GoalClosedEvent = {
      type: GoalEventType.CLOSED,
      aggregateId: "goal_123",
      version: 9,
      timestamp: "2025-01-15T10:00:00.000Z",
      payload: {
        status: GoalStatus.DONE,
        closedAt: "2025-01-15T10:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyGoalClosed).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalClosed).toHaveBeenCalledWith(event);
  });
});
