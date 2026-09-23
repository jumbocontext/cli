import { jest } from "@jest/globals";
import { IGetGoalViewReader } from "../../../../../src/application/context/goals/get/IGetGoalViewReader";
import { IGoalPostponedEventReader } from "../../../../../src/application/context/goals/postpone/IGoalPostponedEventReader";
import { IGoalPostponedEventWriter } from "../../../../../src/application/context/goals/postpone/IGoalPostponedEventWriter";
import { PostponeGoalCommandHandler } from "../../../../../src/application/context/goals/postpone/PostponeGoalCommandHandler";
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
    successCriteria: ["Postponed"],
    scopeIn: [],
    scopeOut: [],
    status: GoalStatus.TODO,
  },
} as const;

describe("PostponeGoalCommandHandler", () => {
  let eventWriter: jest.Mocked<IGoalPostponedEventWriter>;
  let eventReader: jest.Mocked<IGoalPostponedEventReader>;
  let goalReader: jest.Mocked<IGetGoalViewReader>;
  let eventBus: jest.Mocked<IEventBus>;
  let handler: PostponeGoalCommandHandler;

  beforeEach(() => {
    eventWriter = { append: jest.fn<IGoalPostponedEventWriter["append"]>().mockResolvedValue({ nextSeq: 2 }) };
    eventReader = { readStream: jest.fn<IGoalPostponedEventReader["readStream"]>().mockResolvedValue([addedEvent]) };
    goalReader = {
      findById: jest.fn<IGetGoalViewReader["findById"]>().mockResolvedValue({
        goalId: "goal_123",
        title: "Later work",
        objective: "Keep this visible",
        successCriteria: ["Postponed"],
        scopeIn: [],
        scopeOut: [],
        status: GoalStatus.TODO,
        version: 1,
        createdAt: addedEvent.timestamp,
        updatedAt: addedEvent.timestamp,
        progress: [],
      }),
    };
    eventBus = {
      subscribe: jest.fn<IEventBus["subscribe"]>(),
      publish: jest.fn<IEventBus["publish"]>().mockResolvedValue(undefined),
    };
    handler = new PostponeGoalCommandHandler(eventWriter, eventReader, goalReader, eventBus);
  });

  it("rehydrates, persists, and publishes GoalPostponedEvent", async () => {
    await expect(handler.execute({ goalId: "goal_123" })).resolves.toEqual({ status: GoalStatus.POSTPONED });

    const event = eventWriter.append.mock.calls[0][0];
    expect(event).toEqual(expect.objectContaining({
      type: GoalEventType.POSTPONED,
      aggregateId: "goal_123",
      version: 2,
      payload: { status: GoalStatus.POSTPONED },
    }));
    expect(eventBus.publish).toHaveBeenCalledWith(event);
  });

  it("rejects a missing goal without reading or writing events", async () => {
    goalReader.findById.mockResolvedValue(null);

    await expect(handler.execute({ goalId: "missing" })).rejects.toThrow("Goal not found: missing");
    expect(eventReader.readStream).not.toHaveBeenCalled();
    expect(eventWriter.append).not.toHaveBeenCalled();
  });

  it("propagates the domain rejection for a non-defined source state", async () => {
    eventReader.readStream.mockResolvedValue([
      addedEvent,
      {
        type: GoalEventType.POSTPONED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2026-09-11T10:00:00.000Z",
        payload: { status: GoalStatus.POSTPONED },
      },
    ]);

    await expect(handler.execute({ goalId: "goal_123" })).rejects.toThrow(
      "Cannot postpone goal in postponed status. Goal must be in defined status."
    );
    expect(eventWriter.append).not.toHaveBeenCalled();
  });
});
