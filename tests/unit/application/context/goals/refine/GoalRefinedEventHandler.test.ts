/**
 * Tests for GoalRefinedEventHandler (projection event handler)
 */

import { GoalRefinedEventHandler } from "../../../../../../src/application/context/goals/refine/GoalRefinedEventHandler";
import { IGoalRefinedProjector } from "../../../../../../src/application/context/goals/refine/IGoalRefinedProjector";
import { GoalRefinedEvent } from "../../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalRefinedEventHandler", () => {
  let projector: IGoalRefinedProjector;
  let handler: GoalRefinedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyGoalRefined: jest.fn().mockResolvedValue(undefined),
    };

    handler = new GoalRefinedEventHandler(projector);
  });

  it("should apply GoalRefinedEvent to projector", async () => {
    // Arrange
    const event: GoalRefinedEvent = {
      type: GoalEventType.REFINED,
      aggregateId: "goal_123",
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.REFINED,
        refinedAt: new Date().toISOString(),
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalRefined).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalRefined).toHaveBeenCalledWith(event);
  });

  it("should handle errors from projector", async () => {
    // Arrange
    const event: GoalRefinedEvent = {
      type: GoalEventType.REFINED,
      aggregateId: "goal_123",
      version: 2,
      timestamp: new Date().toISOString(),
      payload: {
        status: GoalStatus.REFINED,
        refinedAt: new Date().toISOString(),
      },
    };

    (projector.applyGoalRefined as jest.Mock).mockRejectedValue(
      new Error("Projector failure")
    );

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow("Projector failure");
  });
});
