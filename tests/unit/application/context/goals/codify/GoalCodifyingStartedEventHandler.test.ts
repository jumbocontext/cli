import { GoalCodifyingStartedEventHandler } from "../../../../../../src/application/context/goals/codify/GoalCodifyingStartedEventHandler";
import { IGoalCodifyingStartedProjector } from "../../../../../../src/application/context/goals/codify/IGoalCodifyingStartedProjector";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalCodifyingStartedEvent } from "../../../../../../src/domain/goals/codify/GoalCodifyingStartedEvent";
import { jest } from "@jest/globals";

describe("GoalCodifyingStartedEventHandler", () => {
  let projector: jest.Mocked<IGoalCodifyingStartedProjector>;
  let handler: GoalCodifyingStartedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalCodifyingStarted: jest.fn().mockResolvedValue(undefined),
    };
    handler = new GoalCodifyingStartedEventHandler(projector);
  });

  it("should delegate to projector with typed event", async () => {
    const event: GoalCodifyingStartedEvent = {
      type: GoalEventType.CODIFYING_STARTED,
      aggregateId: "goal_123",
      version: 8,
      timestamp: "2025-01-15T10:00:00.000Z",
      payload: {
        status: GoalStatus.CODIFYING,
        codifyStartedAt: "2025-01-15T10:00:00.000Z",
        claimedBy: "worker_abc",
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T12:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyGoalCodifyingStarted).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalCodifyingStarted).toHaveBeenCalledWith(event);
  });
});
