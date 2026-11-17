/**
 * Tests for SubmitGoalCommandHandler (command handler)
 */

import { SubmitGoalCommandHandler } from "../../../../../../src/application/context/goals/submit/SubmitGoalCommandHandler";
import { SubmitGoalCommand } from "../../../../../../src/application/context/goals/submit/SubmitGoalCommand";
import { IGoalSubmittedEventWriter } from "../../../../../../src/application/context/goals/submit/IGoalSubmittedEventWriter";
import { IGoalSubmittedEventReader } from "../../../../../../src/application/context/goals/submit/IGoalSubmittedEventReader";
import { IGoalSubmitReader } from "../../../../../../src/application/context/goals/submit/IGoalSubmitReader";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus";
import { GoalEventType, GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IGoalClaimStore } from "../../../../../../src/application/context/goals/claims/IGoalClaimStore";
import { IClock } from "../../../../../../src/application/time-and-date/IClock";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { GoalContextQueryHandler } from "../../../../../../src/application/context/goals/get/GoalContextQueryHandler";
import { jest } from "@jest/globals";

describe("SubmitGoalCommandHandler", () => {
  let eventWriter: IGoalSubmittedEventWriter;
  let eventReader: IGoalSubmittedEventReader;
  let goalReader: IGoalSubmitReader;
  let eventBus: IEventBus;
  let claimStore: IGoalClaimStore;
  let clock: IClock;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;
  let goalContextQueryHandler: GoalContextQueryHandler;
  let handler: SubmitGoalCommandHandler;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 4 }),
    };

    eventReader = {
      readStream: jest.fn(),
    };

    goalReader = {
      findById: jest.fn(),
    };

    eventBus = {
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
    };

    claimStore = {
      getClaim: jest.fn().mockReturnValue(null),
      setClaim: jest.fn(),
      releaseClaim: jest.fn(),
    };

    clock = {
      nowIso: jest.fn().mockReturnValue("2025-01-15T10:00:00.000Z"),
    };

    claimPolicy = new GoalClaimPolicy(claimStore, clock);

    workerIdentityReader = {
      workerId: testWorkerId,
    };

    goalContextQueryHandler = {
      execute: jest.fn().mockImplementation(async (goalId: string) => ({
        goal: { goalId, objective: "Test", status: GoalStatus.SUBMITTED },
        context: {
          components: [],
          dependencies: [],
          decisions: [],
          invariants: [],
          guidelines: [],
        },
      })),
    } as unknown as GoalContextQueryHandler;

    handler = new SubmitGoalCommandHandler(
      eventWriter,
      eventReader,
      goalReader,
      eventBus,
      claimPolicy,
      workerIdentityReader,
      goalContextQueryHandler
    );
  });

  it("should submit goal from doing status and publish GoalSubmittedEvent", async () => {
    const command: SubmitGoalCommand = { goalId: "goal_123" };

    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Implement feature",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DOING,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Test",
          objective: "Implement feature",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINED,
        aggregateId: "goal_123",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
      {
        type: GoalEventType.STARTED,
        aggregateId: "goal_123",
        version: 3,
        timestamp: "2025-01-01T02:00:00Z",
        payload: { status: GoalStatus.DOING },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    const result = await handler.execute(command);

    expect(result.goal.goalId).toBe("goal_123");

    // Verify event was appended
    expect(eventWriter.append).toHaveBeenCalledTimes(1);
    const appendedEvent = (eventWriter.append as jest.Mock).mock.calls[0][0];
    expect(appendedEvent.type).toBe(GoalEventType.SUBMITTED);
    expect(appendedEvent.aggregateId).toBe("goal_123");
    expect(appendedEvent.version).toBe(4);
    expect(appendedEvent.payload.status).toBe(GoalStatus.SUBMITTED);
    expect(appendedEvent.payload.submittedAt).toBeDefined();

    // Verify claim was released
    expect(claimStore.releaseClaim).toHaveBeenCalledWith("goal_123");

    // Verify event was published
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(publishedEvent.type).toBe(GoalEventType.SUBMITTED);
  });

  it("should throw error if goal not found", async () => {
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute({ goalId: "nonexistent" })).rejects.toThrow(
      "Goal not found: nonexistent"
    );
  });

  it("should throw error when submitting from refined status", async () => {
    const mockView: GoalView = {
      goalId: "goal_789",
      objective: "Not started",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.REFINED,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    const mockHistory = [
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_789",
        version: 1,
        timestamp: "2025-01-01T00:00:00Z",
        payload: {
          title: "Test",
          objective: "Not started",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: GoalStatus.TODO,
        },
      },
      {
        type: GoalEventType.REFINED,
        aggregateId: "goal_789",
        version: 2,
        timestamp: "2025-01-01T01:00:00Z",
        payload: { status: GoalStatus.REFINED },
      },
    ];
    (eventReader.readStream as jest.Mock).mockResolvedValue(mockHistory);

    await expect(handler.execute({ goalId: "goal_789" })).rejects.toThrow(
      "Cannot submit goal in refined status. Goal must be in doing status."
    );
  });

  it("should throw error if goal is claimed by another worker", async () => {
    const mockView: GoalView = {
      goalId: "goal_123",
      objective: "Test",
      successCriteria: ["Criterion"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.DOING,
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

    const otherWorkerId = createWorkerId("other-worker-id");
    (claimStore.getClaim as jest.Mock).mockReturnValue({
      goalId: "goal_123",
      claimedBy: otherWorkerId,
      claimedAt: "2025-01-15T09:00:00.000Z",
      claimExpiresAt: "2025-01-15T11:00:00.000Z",
    });

    await expect(handler.execute({ goalId: "goal_123" })).rejects.toThrow(
      "Goal is claimed by another worker"
    );

    expect(eventWriter.append).not.toHaveBeenCalled();
  });
});
