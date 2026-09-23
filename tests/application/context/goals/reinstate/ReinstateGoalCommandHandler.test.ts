import { jest } from "@jest/globals";
import { IGetGoalViewReader } from "../../../../../src/application/context/goals/get/IGetGoalViewReader";
import { IGoalReinstatedEventReader } from "../../../../../src/application/context/goals/reinstate/IGoalReinstatedEventReader";
import { IGoalReinstatedEventWriter } from "../../../../../src/application/context/goals/reinstate/IGoalReinstatedEventWriter";
import { ReinstateGoalCommandHandler } from "../../../../../src/application/context/goals/reinstate/ReinstateGoalCommandHandler";
import { IEventBus } from "../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";

const addedEvent = {
  type: GoalEventType.ADDED,
  aggregateId: "goal_123",
  version: 1,
  timestamp: "2026-09-11T09:00:00.000Z",
  payload: {
    title: "Later work",
    objective: "Keep this visible",
    successCriteria: ["Reinstated"],
    scopeIn: [],
    scopeOut: [],
    status: GoalStatus.TODO,
  },
} as const;

const postponedEvent = {
  type: GoalEventType.POSTPONED,
  aggregateId: "goal_123",
  version: 2,
  timestamp: "2026-09-11T10:00:00.000Z",
  payload: { status: GoalStatus.POSTPONED },
} as const;

describe("ReinstateGoalCommandHandler", () => {
  let eventWriter: jest.Mocked<IGoalReinstatedEventWriter>;
  let eventReader: jest.Mocked<IGoalReinstatedEventReader>;
  let goalReader: jest.Mocked<IGetGoalViewReader>;
  let eventBus: jest.Mocked<IEventBus>;
  let handler: ReinstateGoalCommandHandler;

  beforeEach(() => {
    eventWriter = { append: jest.fn<IGoalReinstatedEventWriter["append"]>().mockResolvedValue({ nextSeq: 3 }) };
    eventReader = { readStream: jest.fn<IGoalReinstatedEventReader["readStream"]>().mockResolvedValue([addedEvent, postponedEvent]) };
    goalReader = {
      findById: jest.fn<IGetGoalViewReader["findById"]>().mockResolvedValue({
        goalId: "goal_123",
        title: "Later work",
        objective: "Keep this visible",
        successCriteria: ["Reinstated"],
        scopeIn: [],
        scopeOut: [],
        status: GoalStatus.POSTPONED,
        version: 2,
        createdAt: addedEvent.timestamp,
        updatedAt: postponedEvent.timestamp,
        progress: [],
      }),
    };
    eventBus = {
      subscribe: jest.fn<IEventBus["subscribe"]>(),
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
    };
    handler = new ReinstateGoalCommandHandler(eventWriter, eventReader, goalReader, eventBus);
  });

  it("rehydrates, persists, and publishes GoalReinstatedEvent", async () => {
    await expect(handler.execute({ goalId: "goal_123" })).resolves.toEqual({ status: GoalStatus.TODO });

    const event = eventWriter.append.mock.calls[0][0];
    expect(event).toEqual(expect.objectContaining({
      type: GoalEventType.REINSTATED,
      aggregateId: "goal_123",
      version: 3,
      payload: { status: GoalStatus.TODO },
    }));
    expect(eventBus.publish).toHaveBeenCalledWith(event);
  });

  it("rejects a missing goal without reading or writing events", async () => {
    goalReader.findById.mockResolvedValue(null);

    await expect(handler.execute({ goalId: "missing" })).rejects.toThrow("Goal not found: missing");
    expect(eventReader.readStream).not.toHaveBeenCalled();
    expect(eventWriter.append).not.toHaveBeenCalled();
  });

  it("propagates the domain rejection for a non-postponed source state", async () => {
    eventReader.readStream.mockResolvedValue([addedEvent]);

    await expect(handler.execute({ goalId: "goal_123" })).rejects.toThrow(
      "Cannot reinstate goal in defined status. Goal must be in postponed status."
    );
    expect(eventWriter.append).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
