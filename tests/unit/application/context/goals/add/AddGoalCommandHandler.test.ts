/**
 * Tests for AddGoalCommandHandler (command handler)
 *
 * Note: Handler generates goalId as part of orchestration (Clean Architecture).
 * Commands express user intent only - no generated IDs.
 */

import { AddGoalCommandHandler } from "../../../../../../src/application/context/goals/add/AddGoalCommandHandler";
import { AddGoalCommand } from "../../../../../../src/application/context/goals/add/AddGoalCommand";
import { IGoalAddedEventWriter } from "../../../../../../src/application/context/goals/add/IGoalAddedEventWriter";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("AddGoalCommandHandler", () => {
  let eventWriter: IGoalAddedEventWriter;
  let eventBus: IEventBus;
  let handler: AddGoalCommandHandler;

  beforeEach(() => {
    // Mock event writer
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 }),
    };

    // Mock event bus
    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    handler = new AddGoalCommandHandler(eventWriter, eventBus);
  });

  it("should generate goalId and publish GoalAddedEvent event", async () => {
    // Arrange - command contains only user-provided data, no goalId
    const command: AddGoalCommand = {
      title: "Implement auth",
      objective: "Implement authentication",
      successCriteria: ["Users can log in"],
      scopeIn: ["AuthController"],
      scopeOut: ["AdminPanel"],
    };

    // Act
    const result = await handler.execute(command);

    // Assert - handler generates goalId with correct format
    expect(result.goalId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    // Verify event was appended to event store
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.ADDED);
    expect(appendedEvent.aggregateId).toBe(result.goalId);
    expect(appendedEvent.version).toBe(1);
    expect(appendedEvent.payload.objective).toBe("Implement authentication");
    expect(appendedEvent.payload.successCriteria).toEqual(["Users can log in"]);
    expect(appendedEvent.payload.status).toBe(GoalStatus.TODO);

    // Verify event was published to event bus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.ADDED);
    expect(publishedEvent.aggregateId).toBe(result.goalId);
  });

  it("should handle minimal command with only required fields", async () => {
    // Arrange
    const command: AddGoalCommand = {
      title: "Fix bug #123",
      objective: "Fix bug #123",
      successCriteria: ["Bug is resolved"],
    };

    // Act
    const result = await handler.execute(command);

    // Assert - goalId is generated
    expect(result.goalId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.scopeIn).toEqual([]);
    expect(appendedEvent.payload.scopeOut).toEqual([]);
  });

  it("should propagate validation errors from domain", async () => {
    // Arrange: Empty objective should fail domain validation
    const command: AddGoalCommand = {
      title: "Validation test",
      objective: "",
      successCriteria: ["Criterion 1"],
    };

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(
      "Goal objective must be provided"
    );
  });

  it("should include prerequisiteGoals in event payload when provided", async () => {
    // Arrange
    const command: AddGoalCommand = {
      title: "Dependent goal",
      objective: "Implement feature that depends on others",
      successCriteria: ["Feature works"],
      prerequisiteGoals: ["goal_prereq-1", "goal_prereq-2"],
    };

    // Act
    const result = await handler.execute(command);

    // Assert
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.prerequisiteGoals).toEqual([
      "goal_prereq-1",
      "goal_prereq-2",
    ]);
  });

  it("should not include prerequisiteGoals in event payload when not provided", async () => {
    // Arrange
    const command: AddGoalCommand = {
      title: "Independent goal",
      objective: "Implement standalone feature",
      successCriteria: ["Feature works"],
    };

    // Act
    await handler.execute(command);

    // Assert
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.payload.prerequisiteGoals).toBeUndefined();
  });

  it("should propagate errors if event store fails", async () => {
    // Arrange
    const command: AddGoalCommand = {
      title: "Test goal",
      objective: "Test goal",
      successCriteria: ["Criterion 1"],
    };

    (eventWriter.append as jest.Mock).mockRejectedValue(
      new Error("Event store failure")
    );

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow("Event store failure");
  });

});
