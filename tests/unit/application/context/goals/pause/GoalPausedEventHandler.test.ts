/**
 * Tests for GoalPausedEventHandler (projection event handler)
 */

import { GoalPausedEventHandler } from "../../../../../../src/application/context/goals/pause/GoalPausedEventHandler";
import { IGoalPausedProjector } from "../../../../../../src/application/context/goals/pause/IGoalPausedProjector";
import { GoalPausedEvent } from "../../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalPausedEventHandler", () => {
  let projector: IGoalPausedProjector;
  let handler: GoalPausedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyGoalPaused: jest.fn().mockResolvedValue(undefined),
    };

    handler = new GoalPausedEventHandler(projector);
  });

  it("should apply GoalPausedEvent to projector", async () => {
    // Arrange
    const event: GoalPausedEvent = {
      type: GoalEventType.PAUSED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.PAUSED,
        reason: "ContextCompressed",
        note: "Pausing to compress context",
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalPaused).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalPaused).toHaveBeenCalledWith(event);
  });

  it("should apply GoalPausedEvent without note", async () => {
    // Arrange
    const event: GoalPausedEvent = {
      type: GoalEventType.PAUSED,
      aggregateId: "goal_456",
      version: 3,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.PAUSED,
        reason: "Other",
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalPaused).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalPaused).toHaveBeenCalledWith(event);
  });

  it("should handle errors from projector", async () => {
    // Arrange
    const event: GoalPausedEvent = {
      type: GoalEventType.PAUSED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.PAUSED,
        reason: "ContextCompressed",
      },
    };

    (projector.applyGoalPaused as jest.Mock).mockRejectedValue(
      new Error("Projector failure")
    );

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow("Projector failure");
  });
});
