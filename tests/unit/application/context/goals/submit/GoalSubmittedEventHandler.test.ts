import { GoalSubmittedEventHandler } from "../../../../../../src/application/context/goals/submit/GoalSubmittedEventHandler";
import { IGoalSubmittedProjector } from "../../../../../../src/application/context/goals/submit/IGoalSubmittedProjector";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalSubmittedEvent } from "../../../../../../src/domain/goals/submit/GoalSubmittedEvent";
import { jest } from "@jest/globals";

describe("GoalSubmittedEventHandler", () => {
  let projector: jest.Mocked<IGoalSubmittedProjector>;
  let handler: GoalSubmittedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalSubmitted: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GoalSubmittedEventHandler(projector);
  });

  it("should delegate to projector with typed event", async () => {
    const event: GoalSubmittedEvent = {
      type: GoalEventType.SUBMITTED,
      aggregateId: "goal_123",
      version: 4,
      timestamp: "2025-01-15T10:00:00.000Z",
      payload: {
        status: GoalStatus.SUBMITTED,
        submittedAt: "2025-01-15T10:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyGoalSubmitted).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalSubmitted).toHaveBeenCalledWith(event);
  });
});
