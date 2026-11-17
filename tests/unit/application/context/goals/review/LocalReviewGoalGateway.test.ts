/**
 * Tests for LocalReviewGoalGateway
 *
 * Tests the orchestration of goal review submission.
 */

import { LocalReviewGoalGateway } from "../../../../../../src/application/context/goals/review/LocalReviewGoalGateway";
import { SubmitGoalForReviewCommandHandler } from "../../../../../../src/application/context/goals/review/SubmitGoalForReviewCommandHandler";
import { IGoalSubmitForReviewReader } from "../../../../../../src/application/context/goals/review/IGoalSubmitForReviewReader";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { jest } from "@jest/globals";

describe("LocalReviewGoalGateway", () => {
  let commandHandler: SubmitGoalForReviewCommandHandler;
  let goalReader: IGoalSubmitForReviewReader;

  const createMockGoalView = (overrides?: Partial<GoalView>): GoalView => ({
    goalId: "goal_123",
    objective: "Test objective",
    successCriteria: ["Criteria 1"],
    scopeIn: [],
    scopeOut: [],

    status: GoalStatus.SUBMITTED,
    version: 4,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    progress: [],
    ...overrides,
  });

  const createMockGoalContext = (goalView: GoalView) => ({
    goal: goalView,
    context: {
      components: [],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
    },
  });

  beforeEach(() => {
    const mockContext = createMockGoalContext(createMockGoalView());

    commandHandler = {
      execute: jest.fn().mockResolvedValue(mockContext),
    } as unknown as SubmitGoalForReviewCommandHandler;

    goalReader = {
      findById: jest.fn(),
    };
  });

  describe("reviewGoal", () => {
    it("successfully submits goal for review and returns criteria context", async () => {
      const mockView = createMockGoalView();
      const mockUpdatedView = createMockGoalView({ status: GoalStatus.INREVIEW });
      const mockContext = createMockGoalContext(mockUpdatedView);

      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(mockView)
        .mockResolvedValueOnce(mockUpdatedView);
      (commandHandler.execute as jest.Mock).mockResolvedValue(mockContext);

      const gateway = new LocalReviewGoalGateway(
        commandHandler,
        goalReader
      );

      const response = await gateway.reviewGoal({ goalId: "goal_123" });

      expect(response.goalId).toBe("goal_123");
      expect(response.objective).toBe("Test objective");
      expect(response.status).toBe(GoalStatus.INREVIEW);
      expect(response.criteria).toBe(mockContext);
      expect(commandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
    });

    it("throws error when goal is not found", async () => {
      (goalReader.findById as jest.Mock).mockResolvedValue(null);

      const gateway = new LocalReviewGoalGateway(
        commandHandler,
        goalReader
      );

      const expectedMessage = formatErrorMessage(
        GoalErrorMessages.GOAL_NOT_FOUND,
        { id: "goal_nonexistent" }
      );

      await expect(
        gateway.reviewGoal({ goalId: "goal_nonexistent" })
      ).rejects.toThrow(expectedMessage);

      expect(commandHandler.execute).not.toHaveBeenCalled();
    });

    it("propagates error from command handler when goal cannot be submitted for review", async () => {
      const mockView = createMockGoalView({ status: GoalStatus.COMPLETED });
      (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

      const commandError = new Error(
        formatErrorMessage(
          GoalErrorMessages.CANNOT_SUBMIT_FOR_REVIEW_IN_STATUS,
          { status: GoalStatus.COMPLETED }
        )
      );
      (commandHandler.execute as jest.Mock).mockRejectedValue(commandError);

      const gateway = new LocalReviewGoalGateway(
        commandHandler,
        goalReader
      );

      await expect(
        gateway.reviewGoal({ goalId: "goal_123" })
      ).rejects.toThrow(commandError.message);
    });

    it("returns full criteria context for QA verification", async () => {
      const mockView = createMockGoalView();
      const mockUpdatedView = createMockGoalView({ status: GoalStatus.INREVIEW });

      const mockContext = {
        goal: mockUpdatedView,
        context: {
          components: [{ componentId: "comp_1", name: "Test Component", description: "Desc", status: "active" }],
          dependencies: [{ dependencyId: "dep_1", name: "A -> B", purpose: "API" }],
          decisions: [{ decisionId: "dec_1", title: "Use TypeScript", rationale: "Type safety", status: "active" }],
          invariants: [{ invariantId: "inv_1", title: "coding", description: "Use strict mode" }],
          guidelines: [{ guidelineId: "guide_1", category: "testing", description: "100% coverage" }],
        },
      };

      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(mockView)
        .mockResolvedValueOnce(mockUpdatedView);
      (commandHandler.execute as jest.Mock).mockResolvedValue(mockContext);

      const gateway = new LocalReviewGoalGateway(
        commandHandler,
        goalReader
      );

      const response = await gateway.reviewGoal({ goalId: "goal_123" });

      expect(response.criteria).toEqual(mockContext);
      expect(response.criteria.context.components).toHaveLength(1);
      expect(response.criteria.context.invariants).toHaveLength(1);
      expect(response.criteria.context.guidelines).toHaveLength(1);
    });
  });
});
