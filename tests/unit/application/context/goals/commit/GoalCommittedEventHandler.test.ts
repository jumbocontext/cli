/**
 * Tests for GoalCommittedEventHandler (projection event handler)
 */

import { GoalCommittedEventHandler } from "../../../../../../src/application/context/goals/commit/GoalCommittedEventHandler";
import { IGoalCommittedProjector } from "../../../../../../src/application/context/goals/commit/IGoalCommittedProjector";
import { GoalCommittedEvent } from "../../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalCommittedEventHandler", () => {
  let projector: IGoalCommittedProjector;
  let handler: GoalCommittedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyGoalCommitted: jest.fn().mockResolvedValue(undefined),
    };

    handler = new GoalCommittedEventHandler(projector);
  });

  it("should apply GoalCommittedEvent to projector", async () => {
    // Arrange
    const event: GoalCommittedEvent = {
      type: GoalEventType.COMMITTED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.REFINED,
        committedAt: new Date().toISOString(),
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalCommitted).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalCommitted).toHaveBeenCalledWith(event);
  });

  it("should handle errors from projector", async () => {
    // Arrange
    const event: GoalCommittedEvent = {
      type: GoalEventType.COMMITTED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.REFINED,
        committedAt: new Date().toISOString(),
      },
    };

    (projector.applyGoalCommitted as jest.Mock).mockRejectedValue(
      new Error("Projector failure")
    );

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow("Projector failure");
  });
});
