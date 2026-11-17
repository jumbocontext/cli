/**
 * Tests for GoalResumedEventHandler (projection event handler)
 */

import { GoalResumedEventHandler } from "../../../../../../src/application/context/goals/resume/GoalResumedEventHandler";
import { IGoalResumedProjector } from "../../../../../../src/application/context/goals/resume/IGoalResumedProjector";
import { GoalResumedEvent } from "../../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalResumedEventHandler", () => {
  let projector: IGoalResumedProjector;
  let handler: GoalResumedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyGoalResumed: jest.fn().mockResolvedValue(undefined),
    };

    handler = new GoalResumedEventHandler(projector);
  });

  it("should apply GoalResumedEvent to projector", async () => {
    // Arrange
    const event: GoalResumedEvent = {
      type: GoalEventType.RESUMED,
      aggregateId: "goal_123",
      version: 4,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.DOING,
        note: "Ready to continue",
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalResumed).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalResumed).toHaveBeenCalledWith(event);
  });

  it("should apply GoalResumedEvent without note", async () => {
    // Arrange
    const event: GoalResumedEvent = {
      type: GoalEventType.RESUMED,
      aggregateId: "goal_456",
      version: 4,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.DOING,
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalResumed).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalResumed).toHaveBeenCalledWith(event);
  });

  it("should handle errors from projector", async () => {
    // Arrange
    const event: GoalResumedEvent = {
      type: GoalEventType.RESUMED,
      aggregateId: "goal_123",
      version: 4,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.DOING,
      },
    };

    (projector.applyGoalResumed as jest.Mock).mockRejectedValue(
      new Error("Projector failure")
    );

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow("Projector failure");
  });
});
