/**
 * Tests for LocalQualifyGoalGateway
 *
 * Tests the orchestration of goal qualification after QA review.
 */

import { LocalQualifyGoalGateway } from "../../../../../../src/application/context/goals/qualify/LocalQualifyGoalGateway";
import { QualifyGoalCommandHandler } from "../../../../../../src/application/context/goals/qualify/QualifyGoalCommandHandler";
import { IGoalQualifyReader } from "../../../../../../src/application/context/goals/qualify/IGoalQualifyReader";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../../src/application/host/workers/WorkerId";
import { jest } from "@jest/globals";

describe("LocalQualifyGoalGateway", () => {
  let commandHandler: QualifyGoalCommandHandler;
  let goalReader: IGoalQualifyReader;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;

  const testWorkerId = createWorkerId("test-worker-id");

  const createMockGoalView = (overrides?: Partial<GoalView>): GoalView => ({
    goalId: "goal_123",
    objective: "Test objective",
    successCriteria: ["Criteria 1"],
    scopeIn: [],
    scopeOut: [],

    status: GoalStatus.INREVIEW,
    version: 3,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    progress: [],
    nextGoalId: "goal_456",
    ...overrides,
  });

  beforeEach(() => {
    commandHandler = {
      execute: jest.fn().mockResolvedValue({ goalId: "goal_123" }),
    } as unknown as QualifyGoalCommandHandler;

    goalReader = {
      findById: jest.fn(),
    };

    // Mock claim policy - default to allowing claims (no existing claim)
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
    } as unknown as GoalClaimPolicy;

    workerIdentityReader = {
      workerId: testWorkerId,
    };
  });

  describe("qualifyGoal", () => {
    it("successfully qualifies goal and returns response with next goal id", async () => {
      const mockView = createMockGoalView();
      const mockUpdatedView = createMockGoalView({ status: GoalStatus.QUALIFIED });

      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(mockView)
        .mockResolvedValueOnce(mockUpdatedView);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const response = await gateway.qualifyGoal({ goalId: "goal_123" });

      expect(response.goalId).toBe("goal_123");
      expect(response.objective).toBe("Test objective");
      expect(response.status).toBe(GoalStatus.QUALIFIED);
      expect(response.nextGoalId).toBe("goal_456");
      expect(commandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
    });

    it("rejects when goal is claimed by another worker", async () => {
      const otherWorkerId = createWorkerId("other-worker-id");
      (claimPolicy.canClaim as jest.Mock).mockReturnValue({
        allowed: false,
        reason: "CLAIMED_BY_ANOTHER_WORKER",
        existingClaim: {
          goalId: "goal_123",
          claimedBy: otherWorkerId,
          claimedAt: "2025-01-15T09:00:00.000Z",
          claimExpiresAt: "2025-01-15T11:00:00.000Z",
        },
      });

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      await expect(
        gateway.qualifyGoal({ goalId: "goal_123" })
      ).rejects.toThrow(
        "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
      );

      // Verify nothing else was called
      expect(goalReader.findById).not.toHaveBeenCalled();
      expect(commandHandler.execute).not.toHaveBeenCalled();
    });

    it("throws error when goal is not found", async () => {
      (goalReader.findById as jest.Mock).mockResolvedValue(null);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const expectedMessage = formatErrorMessage(
        GoalErrorMessages.GOAL_NOT_FOUND,
        { id: "goal_nonexistent" }
      );

      await expect(
        gateway.qualifyGoal({ goalId: "goal_nonexistent" })
      ).rejects.toThrow(expectedMessage);

      expect(commandHandler.execute).not.toHaveBeenCalled();
    });

    it("throws error when goal is not in in-review status", async () => {
      const mockView = createMockGoalView({ status: GoalStatus.DOING });
      (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const expectedMessage = formatErrorMessage(
        GoalErrorMessages.CANNOT_QUALIFY_IN_STATUS,
        { status: GoalStatus.DOING }
      );

      await expect(
        gateway.qualifyGoal({ goalId: "goal_123" })
      ).rejects.toThrow(expectedMessage);

      expect(commandHandler.execute).not.toHaveBeenCalled();
    });

    it("throws error when goal is in completed status", async () => {
      const mockView = createMockGoalView({ status: GoalStatus.COMPLETED });
      (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const expectedMessage = formatErrorMessage(
        GoalErrorMessages.CANNOT_QUALIFY_IN_STATUS,
        { status: GoalStatus.COMPLETED }
      );

      await expect(
        gateway.qualifyGoal({ goalId: "goal_123" })
      ).rejects.toThrow(expectedMessage);

      expect(commandHandler.execute).not.toHaveBeenCalled();
    });

    it("throws error when goal is in to-do status", async () => {
      const mockView = createMockGoalView({ status: GoalStatus.TODO });
      (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const expectedMessage = formatErrorMessage(
        GoalErrorMessages.CANNOT_QUALIFY_IN_STATUS,
        { status: GoalStatus.TODO }
      );

      await expect(
        gateway.qualifyGoal({ goalId: "goal_123" })
      ).rejects.toThrow(expectedMessage);

      expect(commandHandler.execute).not.toHaveBeenCalled();
    });

    it("validates claim ownership before any other operation", async () => {
      const callOrder: string[] = [];

      (claimPolicy.canClaim as jest.Mock).mockImplementation(() => {
        callOrder.push("claimPolicy.canClaim");
        return { allowed: true };
      });

      (goalReader.findById as jest.Mock).mockImplementation(() => {
        callOrder.push("goalReader.findById");
        return Promise.resolve(createMockGoalView());
      });

      (commandHandler.execute as jest.Mock).mockImplementation(() => {
        callOrder.push("commandHandler.execute");
        return Promise.resolve({ goalId: "goal_123" });
      });

      const mockUpdatedView = createMockGoalView({ status: GoalStatus.QUALIFIED });

      // Second call to findById (after state change)
      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(createMockGoalView())
        .mockResolvedValueOnce(mockUpdatedView);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      await gateway.qualifyGoal({ goalId: "goal_123" });

      expect(callOrder[0]).toBe("claimPolicy.canClaim");
    });

    it("propagates error from command handler", async () => {
      const mockView = createMockGoalView();
      (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

      const commandError = new Error("Command handler error");
      (commandHandler.execute as jest.Mock).mockRejectedValue(commandError);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      await expect(
        gateway.qualifyGoal({ goalId: "goal_123" })
      ).rejects.toThrow("Command handler error");
    });

    it("returns undefined for nextGoalId when not present", async () => {
      const mockView = createMockGoalView({ nextGoalId: undefined });
      const mockUpdatedView = createMockGoalView({ status: GoalStatus.QUALIFIED, nextGoalId: undefined });

      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(mockView)
        .mockResolvedValueOnce(mockUpdatedView);

      const gateway = new LocalQualifyGoalGateway(
        commandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const response = await gateway.qualifyGoal({ goalId: "goal_123" });

      expect(response.nextGoalId).toBeUndefined();
    });
  });
});
