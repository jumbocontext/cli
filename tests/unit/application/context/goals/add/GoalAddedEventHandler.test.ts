/**
 * Tests for GoalAddedEventHandler (projection event handler)
 */

import { GoalAddedEventHandler } from "../../../../../../src/application/context/goals/add/GoalAddedEventHandler";
import { IGoalAddedProjector } from "../../../../../../src/application/context/goals/add/IGoalAddedProjector";
import { GoalAddedEvent } from "../../../../../../src/domain/goals/EventIndex";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("GoalAddedEventHandler", () => {
  let projector: IGoalAddedProjector;
  let handler: GoalAddedEventHandler;

  beforeEach(() => {
    // Mock projector
    projector = {
      applyGoalAdded: jest.fn().mockResolvedValue(undefined),
    };

    handler = new GoalAddedEventHandler(projector);
  });

  it("should apply GoalAddedEvent to projector", async () => {
    // Arrange
    const event: GoalAddedEvent = {
      type: GoalEventType.ADDED,
      aggregateId: "goal_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        objective: "Implement authentication",
        successCriteria: ["Users can log in"],
        scopeIn: ["AuthController"],
        scopeOut: [],
        
        status: GoalStatus.TODO,
      },
    };

    // Act
    await handler.handle(event);

    // Assert
    expect(projector.applyGoalAdded).toHaveBeenCalledTimes(1);
    expect(projector.applyGoalAdded).toHaveBeenCalledWith(event);
  });

  it("should handle errors from projector", async () => {
    // Arrange
    const event: GoalAddedEvent = {
      type: GoalEventType.ADDED,
      aggregateId: "goal_123",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        objective: "Test goal",
        successCriteria: ["Criterion 1"],
        scopeIn: [],
        scopeOut: [],
        
        status: GoalStatus.TODO,
      },
    };

    (projector.applyGoalAdded as jest.Mock).mockRejectedValue(
      new Error("Projector failure")
    );

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow("Projector failure");
  });
});
