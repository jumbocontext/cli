/**
 * Tests for Goal aggregate
 */

import { Goal } from "../../../src/domain/goals/Goal";
import { GoalEventType, GoalStatus, GoalLimits } from "../../../src/domain/goals/Constants";
import type { GoalEvent } from "../../../src/domain/goals/EventIndex";

describe("Goal Aggregate", () => {
  describe("define()", () => {
    it("should create GoalAddedEvent event with required fields only", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Assert
      expect(event.type).toBe(GoalEventType.ADDED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(1);
      expect(event.payload.objective).toBe("Implement authentication");
      expect(event.payload.successCriteria).toEqual(["Users can log in"]);
      expect(event.payload.scopeIn).toEqual([]);
      expect(event.payload.scopeOut).toEqual([]);
      expect(event.payload.status).toBe(GoalStatus.TODO);
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalAddedEvent event with all optional fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add(
        "JWT authentication",
        "Implement JWT authentication",
        ["Token generation on login", "Middleware validates tokens"],
        ["UserController", "AuthMiddleware"],
        ["Admin routes"]
      );

      // Assert
      expect(event.payload.objective).toBe("Implement JWT authentication");
      expect(event.payload.successCriteria).toEqual([
        "Token generation on login",
        "Middleware validates tokens",
      ]);
      expect(event.payload.scopeIn).toEqual(["UserController", "AuthMiddleware"]);
      expect(event.payload.scopeOut).toEqual(["Admin routes"]);
    });

    it("should create GoalAddedEvent with branch and worktree", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add(
        "Multi-agent goal",
        "Implement feature X",
        ["Tests pass"],
        undefined,
        undefined,
        undefined,
        undefined,
        "feature/goal-123",
        "/worktrees/goal-123"
      );

      // Assert
      expect(event.payload.branch).toBe("feature/goal-123");
      expect(event.payload.worktree).toBe("/worktrees/goal-123");
    });

    it("should create GoalAddedEvent without branch and worktree when not provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      const event = goal.add("Simple goal", "Do something", ["Done"]);

      // Assert
      expect(event.payload.branch).toBeUndefined();
      expect(event.payload.worktree).toBeUndefined();
    });

    it("should apply branch and worktree to state from GoalAddedEvent", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      goal.add(
        "Multi-agent goal",
        "Implement feature X",
        ["Tests pass"],
        undefined,
        undefined,
        undefined,
        undefined,
        "feature/goal-123",
        "/worktrees/goal-123"
      );

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.branch).toBe("feature/goal-123");
      expect(snapshot.worktree).toBe("/worktrees/goal-123");
    });

    it("should throw error if goal is already defined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("First goal", "First goal", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.add("Second goal", "Second goal", ["Criterion 2"])).toThrow(
        "Goal has already been defined"
      );
    });

    it("should throw error if objective is empty", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act & Assert
      expect(() => goal.add("Test goal", "", ["Criterion 1"])).toThrow(
        "Goal objective must be provided"
      );
    });

    it("should throw error if objective is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longObjective = "a".repeat(1501); // Max is 1500

      // Act & Assert
      expect(() => goal.add("Test goal", longObjective, ["Criterion 1"])).toThrow(
        "Objective must be less than 1500 characters"
      );
    });

    it("should throw error if no success criteria provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act & Assert
      expect(() => goal.add("Test goal", "My objective", [])).toThrow(
        "At least one success criterion must be provided"
      );
    });

    it("should throw error if too many success criteria", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const tooManyCriteria = Array.from(
        { length: GoalLimits.MAX_SUCCESS_CRITERIA + 1 },
        (_, i) => `Criterion ${i}`
      );

      // Act & Assert
      expect(() => goal.add("Test goal", "My objective", tooManyCriteria)).toThrow(
        `Cannot have more than ${GoalLimits.MAX_SUCCESS_CRITERIA} success criteria`
      );
    });

    it("should throw error if success criterion is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longCriterion = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() => goal.add("Test goal", "My objective", [longCriterion])).toThrow(
        "Success criterion must be less than 1000 characters"
      );
    });

    it("should throw error if too many scope items", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const tooManyItems = Array.from({ length: GoalLimits.MAX_SCOPE_ITEMS + 1 }, (_, i) => `Item ${i}`);

      // Act & Assert
      expect(() =>
        goal.add("Test goal", "My objective", ["Criterion 1"], tooManyItems)
      ).toThrow(`Cannot have more than ${GoalLimits.MAX_SCOPE_ITEMS} scope items`);
    });

    it("should throw error if scope item is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      const longItem = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() =>
        goal.add("Test goal", "My objective", ["Criterion 1"], [longItem])
      ).toThrow("Scope item must be less than 200 characters");
    });

    it("should update aggregate state after event creation", () => {
      // Arrange
      const goal = Goal.create("goal_123");

      // Act
      goal.add(
        "Auth feature",
        "Implement authentication",
        ["Users can log in", "Tokens are validated"],
        ["AuthController"],
        ["AdminPanel"]
      );

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.successCriteria).toEqual(["Users can log in", "Tokens are validated"]);
      expect(snapshot.scopeIn).toEqual(["AuthController"]);
      expect(snapshot.scopeOut).toEqual(["AdminPanel"]);
      expect(snapshot.status).toBe(GoalStatus.TODO);
      expect(snapshot.version).toBe(1);
    });

  });

  describe("refine()", () => {
    it("should create GoalRefinedEvent event when refining a to-do goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act
      const event = goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });

      // Assert
      expect(event.type).toBe(GoalEventType.REFINEMENT_STARTED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.status).toBe(GoalStatus.IN_REFINEMENT);
      expect(event.payload.refinementStartedAt).toBeDefined();
      expect(event.payload.claimedBy).toBe("worker_test");
      expect(event.payload.claimedAt).toBe("2025-01-01T00:00:00Z");
      expect(event.payload.claimExpiresAt).toBe("2025-01-01T01:00:00Z");
      expect(event.timestamp).toBeDefined();
    });

    it("should update aggregate state to in-refinement after refine", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.IN_REFINEMENT);
      expect(snapshot.version).toBe(2);
    });

    it("should allow idempotent re-entry when goal is already in refinement", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      }); // First refine → IN_REFINEMENT

      // Act - re-entry should succeed at domain level (claim validation at application layer)
      const event = goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T02:00:00Z",
        claimExpiresAt: "2025-01-01T03:00:00Z",
      });

      // Assert
      expect(event.type).toBe(GoalEventType.REFINEMENT_STARTED);
      expect(event.payload.status).toBe(GoalStatus.IN_REFINEMENT);
    });

    it("should throw error when refining a doing goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act & Assert
      expect(() => goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      })).toThrow(
        "Cannot refine goal in doing status. Goal must be in defined status."
      );
    });
  });

  describe("start()", () => {
    it("should create GoalStartedEvent event when starting a refined goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();

      // Act
      const event = goal.start();

      // Assert
      expect(event.type).toBe(GoalEventType.STARTED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(4);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.timestamp).toBeDefined();
    });

    it("should update aggregate state to doing after start", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();

      // Act
      goal.start();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.version).toBe(4);
    });

    it("should allow starting already-doing goal (idempotent)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start(); // First start

      // Act - start again
      const event = goal.start();

      // Assert - should succeed
      expect(event.type).toBe(GoalEventType.STARTED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
    });

    it("should throw error when starting to-do goal (not refined)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.start()).toThrow(
        "Cannot start goal. Goal must be refined first."
      );
    });

    it("should throw error when starting blocked goal", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Waiting for API credentials");

      // Act & Assert
      expect(() => goal.start()).toThrow(
        "Cannot start a blocked goal. Unblock it first."
      );
    });

    it("should throw error when starting completed goal", () => {
      // Arrange - rehydrate a goal that is completed
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 6,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act & Assert
      expect(() => goal.start()).toThrow("Cannot start a done goal.");
    });
  });

  describe("update()", () => {
    it("should create GoalUpdatedEvent event with objective only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act
      const event = goal.update(undefined, "Updated objective");

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.objective).toBe("Updated objective");
      expect(event.payload.successCriteria).toBeUndefined();
      expect(event.payload.scopeIn).toBeUndefined();
      expect(event.payload.scopeOut).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalUpdatedEvent event with success criteria only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Old criterion"]);

      // Act
      const event = goal.update(undefined, undefined, ["New criterion 1", "New criterion 2"]);

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.payload.objective).toBeUndefined();
      expect(event.payload.successCriteria).toEqual(["New criterion 1", "New criterion 2"]);
    });

    it("should create GoalUpdatedEvent event with all fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original", ["Criterion 1"]);

      // Act
      const event = goal.update(
        undefined,
        "Updated objective",
        ["Updated criterion"],
        ["In scope"],
        ["Out of scope"]
      );

      // Assert
      expect(event.payload.objective).toBe("Updated objective");
      expect(event.payload.successCriteria).toEqual(["Updated criterion"]);
      expect(event.payload.scopeIn).toEqual(["In scope"]);
      expect(event.payload.scopeOut).toEqual(["Out of scope"]);
    });

    it("should update aggregate state with partial fields", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Original criterion"], ["Original scope in"]);

      // Act - only update objective
      goal.update(undefined, "Updated objective");

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["Original criterion"]); // Unchanged
      expect(snapshot.scopeIn).toEqual(["Original scope in"]); // Unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should throw error if no fields provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update()).toThrow("At least one field must be provided for update");
    });

    it("should throw error if goal is completed", () => {
      // Arrange - skip this test until complete() is implemented
      // This test will be added when Goal.complete() is implemented in Task-06
    });

    it("should throw error if objective is empty", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update(undefined, "")).toThrow("Goal objective must be provided");
    });

    it("should throw error if objective is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);
      const longObjective = "a".repeat(1501); // Max is 1500

      // Act & Assert
      expect(() => goal.update(undefined, longObjective)).toThrow(
        "Objective must be less than 1500 characters"
      );
    });

    it("should throw error if success criteria is empty array", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act & Assert
      expect(() => goal.update(undefined, undefined, [])).toThrow(
        "At least one success criterion must be provided"
      );
    });

    it("should throw error if too many success criteria", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);
      const tooManyCriteria = Array.from(
        { length: GoalLimits.MAX_SUCCESS_CRITERIA + 1 },
        (_, i) => `Criterion ${i}`
      );

      // Act & Assert
      expect(() => goal.update(undefined, undefined, tooManyCriteria)).toThrow(
        `Cannot have more than ${GoalLimits.MAX_SUCCESS_CRITERIA} success criteria`
      );
    });

    it("should throw error if success criterion is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);
      const longCriterion = "a".repeat(1001); // Max is 1000

      // Act & Assert
      expect(() => goal.update(undefined, undefined, [longCriterion])).toThrow(
        "Success criterion must be less than 1000 characters"
      );
    });

    it("should throw error if too many scope items", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);
      const tooManyItems = Array.from({ length: GoalLimits.MAX_SCOPE_ITEMS + 1 }, (_, i) => `Item ${i}`);

      // Act & Assert
      expect(() => goal.update(undefined, undefined, undefined, tooManyItems)).toThrow(
        `Cannot have more than ${GoalLimits.MAX_SCOPE_ITEMS} scope items`
      );
    });

    it("should throw error if scope item is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);
      const longItem = "a".repeat(201); // Max is 200

      // Act & Assert
      expect(() => goal.update(undefined, undefined, undefined, [longItem])).toThrow(
        "Scope item must be less than 200 characters"
      );
    });

    it("should create GoalUpdatedEvent with branch only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act
      const event = goal.update(
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, "feature/new-branch"
      );

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.payload.branch).toBe("feature/new-branch");
      expect(event.payload.worktree).toBeUndefined();
    });

    it("should create GoalUpdatedEvent with worktree only", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act
      const event = goal.update(
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, "/worktrees/goal-123"
      );

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
      expect(event.payload.worktree).toBe("/worktrees/goal-123");
      expect(event.payload.branch).toBeUndefined();
    });

    it("should create GoalUpdatedEvent with branch and worktree", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act
      const event = goal.update(
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, "feature/branch", "/worktrees/goal-123"
      );

      // Assert
      expect(event.payload.branch).toBe("feature/branch");
      expect(event.payload.worktree).toBe("/worktrees/goal-123");
    });

    it("should apply branch and worktree to state from GoalUpdatedEvent", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act
      goal.update(
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, "feature/branch", "/worktrees/goal-123"
      );

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.branch).toBe("feature/branch");
      expect(snapshot.worktree).toBe("/worktrees/goal-123");
      expect(snapshot.objective).toBe("Original objective"); // Unchanged
    });

    it("should not require standard fields when only branch is updated", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Original goal", "Original objective", ["Criterion 1"]);

      // Act - should not throw "At least one field must be provided"
      const event = goal.update(
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, "feature/branch"
      );

      // Assert
      expect(event.type).toBe(GoalEventType.UPDATED);
    });
  });

  describe("block()", () => {
    it("should create GoalBlockedEvent event from to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act
      const event = goal.block("Waiting for API credentials");

      // Assert
      expect(event.type).toBe(GoalEventType.BLOCKED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(2);
      expect(event.payload.status).toBe(GoalStatus.BLOCKED);
      expect(event.payload.note).toBe("Waiting for API credentials");
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalBlockedEvent event from doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act
      const event = goal.block("Database server is down");

      // Assert
      expect(event.type).toBe(GoalEventType.BLOCKED);
      expect(event.payload.status).toBe(GoalStatus.BLOCKED);
      expect(event.payload.note).toBe("Database server is down");
      expect(event.version).toBe(5);
    });

    it("should throw error if note is not provided", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.block("")).toThrow("Note is required when blocking a goal");
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.block(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should throw error if goal is already blocked", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.block("First blocker");

      // Act & Assert
      expect(() => goal.block("Second blocker")).toThrow(
        "Cannot block goal in blocked status. Goal must be in to-do or doing status."
      );
    });
  });

  describe("unblock()", () => {
    it("should create GoalUnblockedEvent event without note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.block("Waiting for API credentials");

      // Act
      const event = goal.unblock();

      // Assert
      expect(event.type).toBe(GoalEventType.UNBLOCKED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(3);
      expect(event.payload.status).toBe(GoalStatus.UNBLOCKED);
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalUnblockedEvent event with resolution note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Database server is down");

      // Act
      const event = goal.unblock("Server is back online");

      // Assert
      expect(event.type).toBe(GoalEventType.UNBLOCKED);
      expect(event.payload.status).toBe(GoalStatus.UNBLOCKED);
      expect(event.payload.note).toBe("Server is back online");
      expect(event.version).toBe(6);
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.block("Blocked");

      // Act
      const event = goal.unblock("   ");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.block("Blocked");
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.unblock(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should throw error if goal is not blocked (to-do status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.unblock()).toThrow(
        "Cannot unblock goal in defined status. Goal must be blocked."
      );
    });

    it("should throw error if goal is not blocked (doing status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act & Assert
      expect(() => goal.unblock()).toThrow(
        "Cannot unblock goal in doing status. Goal must be blocked."
      );
    });

    it("should transition goal to unblocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Blocked");

      // Act
      goal.unblock("Resolved");

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.UNBLOCKED);
      expect(snapshot.note).toBe("Resolved");
      expect(snapshot.version).toBe(6);
    });
  });

  describe("complete()", () => {
    it("should create GoalCompletedEvent event from qualified status", () => {
      // Arrange - rehydrate a goal in qualified status
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act
      const event = goal.complete();

      // Assert
      expect(event.type).toBe(GoalEventType.COMPLETED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(6);
      expect(event.payload.status).toBe(GoalStatus.COMPLETED);
      expect(event.timestamp).toBeDefined();
    });

    it("should throw error if goal is in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete goal. Goal must be approved first."
      );
    });

    it("should throw error if goal is in blocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Waiting for API credentials");

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete goal. Goal must be approved first."
      );
    });

    it("should throw error if goal is not started (to-do status)", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Cannot complete goal. Goal must be approved first."
      );
    });

    it("should throw error if goal is already completed", () => {
      // Arrange - rehydrate a goal that is already completed
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 6,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act & Assert
      expect(() => goal.complete()).toThrow(
        "Goal is already done"
      );
    });

    it("should transition goal to completed status", () => {
      // Arrange - rehydrate a goal in qualified status
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act
      goal.complete();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.COMPLETED);
      expect(snapshot.version).toBe(6);
    });
  });

  describe("rehydrate()", () => {
    it("should rebuild aggregate from event history", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const event = goal1.add(
        "Auth feature",
        "Implement authentication",
        ["Users can log in"],
        ["AuthController"]
      );

      // Act
      const goal2 = Goal.rehydrate("goal_123", [event]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.successCriteria).toEqual(["Users can log in"]);
      expect(snapshot.scopeIn).toEqual(["AuthController"]);
      expect(snapshot.version).toBe(1);
    });

    it("should rebuild aggregate with GoalRefinedEvent and GoalStartedEvent events", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Auth feature", "Implement authentication", ["Users can log in"]);
      const refinedEvent = goal1.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      const committedEvent = goal1.commit();
      const startedEvent = goal1.start();

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, refinedEvent, committedEvent, startedEvent]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Implement authentication");
      expect(snapshot.status).toBe(GoalStatus.DOING);
      expect(snapshot.version).toBe(4);
    });

    it("should rebuild aggregate with GoalUpdatedEvent event", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Original goal", "Original objective", ["Original criterion"], ["Original scope"]);
      const updatedEvent = goal1.update(undefined, "Updated objective", ["Updated criterion 1", "Updated criterion 2"]);

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, updatedEvent]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["Updated criterion 1", "Updated criterion 2"]);
      expect(snapshot.scopeIn).toEqual(["Original scope"]); // Unchanged
      expect(snapshot.version).toBe(2);
    });

    it("should rebuild aggregate with multiple GoalUpdatedEvent events", () => {
      // Arrange
      const goal1 = Goal.create("goal_123");
      const addedEvent = goal1.add("Original goal", "Original objective", ["Criterion 1"]);
      const updated1Event = goal1.update(undefined, "Updated objective");
      const updated2Event = goal1.update(undefined, undefined, ["New criterion"]);

      // Act
      const goal2 = Goal.rehydrate("goal_123", [addedEvent, updated1Event, updated2Event]);

      // Assert
      const snapshot = goal2.snapshot;
      expect(snapshot.objective).toBe("Updated objective");
      expect(snapshot.successCriteria).toEqual(["New criterion"]);
      expect(snapshot.version).toBe(3);
    });
  });

  describe("pause()", () => {
    it("should create GoalPausedEvent event from doing status with reason", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act
      const event = goal.pause("ContextCompressed");

      // Assert
      expect(event.type).toBe(GoalEventType.PAUSED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(5);
      expect(event.payload.status).toBe(GoalStatus.PAUSED);
      expect(event.payload.reason).toBe("ContextCompressed");
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalPausedEvent event with optional note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act
      const event = goal.pause("Other", "Need to switch priorities");

      // Assert
      expect(event.type).toBe(GoalEventType.PAUSED);
      expect(event.payload.status).toBe(GoalStatus.PAUSED);
      expect(event.payload.reason).toBe("Other");
      expect(event.payload.note).toBe("Need to switch priorities");
      expect(event.version).toBe(5);
    });

    it("should throw error if goal is not in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.pause("ContextCompressed")).toThrow(
        "Cannot pause goal in defined status. Goal must be in doing status."
      );
    });

    it("should throw error if goal is already paused", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      // Act & Assert
      expect(() => goal.pause("Other")).toThrow(
        "Cannot pause goal in paused status. Goal must be in doing status."
      );
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.pause("Other", longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act
      const event = goal.pause("ContextCompressed", "");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });
  });

  describe("resume()", () => {
    it("should create GoalResumedEvent event from paused status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      // Act
      const event = goal.resume();

      // Assert
      expect(event.type).toBe(GoalEventType.RESUMED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(6);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should create GoalResumedEvent event with optional note", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      // Act
      const event = goal.resume("Ready to continue");

      // Assert
      expect(event.type).toBe(GoalEventType.RESUMED);
      expect(event.payload.status).toBe(GoalStatus.DOING);
      expect(event.payload.note).toBe("Ready to continue");
      expect(event.version).toBe(6);
    });

    it("should throw error if goal is not paused", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act & Assert
      expect(() => goal.resume()).toThrow(
        "Cannot resume goal in doing status. Goal must be paused."
      );
    });

    it("should throw error if note is too long", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");
      const longNote = "a".repeat(501); // Max is 500

      // Act & Assert
      expect(() => goal.resume(longNote)).toThrow("Note must be less than 500 characters");
    });

    it("should sanitize empty note to undefined", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      // Act
      const event = goal.resume("");

      // Assert
      expect(event.payload.note).toBeUndefined();
    });
  });

  describe("submitForReview()", () => {
    it("should create GoalSubmittedForReviewEvent event from submitted status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();

      // Act
      const event = goal.submitForReview();

      // Assert
      expect(event.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(6);
      expect(event.payload.status).toBe(GoalStatus.INREVIEW);
      expect(event.payload.submittedAt).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should transition goal to in-review status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();

      // Act
      goal.submitForReview();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.INREVIEW);
      expect(snapshot.version).toBe(6);
    });

    it("should throw error if goal is in to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in defined status. Goal must be in submitted status."
      );
    });

    it("should throw error if goal is in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in doing status. Goal must be in submitted status."
      );
    });

    it("should throw error if goal is in paused status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in paused status. Goal must be in submitted status."
      );
    });

    it("should allow idempotent re-entry when goal is already in-review", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();

      // Act - re-entry should succeed at domain level (claim validation at application layer)
      const event = goal.submitForReview({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T02:00:00Z",
        claimExpiresAt: "2025-01-01T03:00:00Z",
      });

      // Assert
      expect(event.type).toBe(GoalEventType.SUBMITTED_FOR_REVIEW);
      expect(event.payload.status).toBe(GoalStatus.INREVIEW);
    });

    it("should throw error if goal is in qualified status", () => {
      // Arrange - rehydrate a goal in qualified status
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in approved status. Goal must be in submitted status."
      );
    });

    it("should throw error if goal is completed", () => {
      // Arrange - rehydrate a goal in completed status
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 6,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act & Assert
      expect(() => goal.submitForReview()).toThrow(
        "Cannot submit goal for review in done status. Goal must be in submitted status."
      );
    });
  });

  describe("qualify()", () => {
    it("should create GoalQualifiedEvent event from in-review status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();

      // Act
      const event = goal.qualify();

      // Assert
      expect(event.type).toBe(GoalEventType.APPROVED);
      expect(event.aggregateId).toBe("goal_123");
      expect(event.version).toBe(7);
      expect(event.payload.status).toBe(GoalStatus.QUALIFIED);
      expect(event.payload.approvedAt).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should transition goal to qualified status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();

      // Act
      goal.qualify();

      // Assert
      const snapshot = goal.snapshot;
      expect(snapshot.status).toBe(GoalStatus.QUALIFIED);
      expect(snapshot.version).toBe(7);
    });

    it("should throw error if goal is in to-do status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot approve goal in defined status. Goal must be in-review."
      );
    });

    it("should throw error if goal is in doing status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot approve goal in doing status. Goal must be in-review."
      );
    });

    it("should throw error if goal is in blocked status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Waiting for API credentials");

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot approve goal in blocked status. Goal must be in-review."
      );
    });

    it("should throw error if goal is in paused status", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot approve goal in paused status. Goal must be in-review."
      );
    });

    it("should throw error if goal is already qualified", () => {
      // Arrange
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();
      goal.qualify();

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot approve goal in approved status. Goal must be in-review."
      );
    });

    it("should throw error if goal is completed", () => {
      // Arrange - rehydrate a goal in completed status
      const history: GoalEvent[] = [
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T00:00:00Z",
          payload: {
            title: "Auth feature",
            objective: "Implement authentication",
            successCriteria: ["Users can log in"],
            scopeIn: [],
            scopeOut: [],

            status: GoalStatus.TODO,
          },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T00:30:00Z",
          payload: {
            status: GoalStatus.REFINED,
            refinedAt: "2025-01-01T00:30:00Z",
          },
        },
        {
          type: GoalEventType.STARTED,
          aggregateId: "goal_123",
          version: 3,
          timestamp: "2025-01-01T01:00:00Z",
          payload: {
            status: GoalStatus.DOING,
          },
        },
        {
          type: GoalEventType.SUBMITTED_FOR_REVIEW,
          aggregateId: "goal_123",
          version: 4,
          timestamp: "2025-01-01T02:00:00Z",
          payload: {
            status: GoalStatus.INREVIEW,
            submittedAt: "2025-01-01T02:00:00Z",
          },
        },
        {
          type: GoalEventType.QUALIFIED,
          aggregateId: "goal_123",
          version: 5,
          timestamp: "2025-01-01T03:00:00Z",
          payload: {
            status: GoalStatus.QUALIFIED,
            qualifiedAt: "2025-01-01T03:00:00Z",
          },
        },
        {
          type: GoalEventType.COMPLETED,
          aggregateId: "goal_123",
          version: 6,
          timestamp: "2025-01-01T04:00:00Z",
          payload: {
            status: GoalStatus.COMPLETED,
          },
        },
      ];
      const goal = Goal.rehydrate("goal_123", history);

      // Act & Assert
      expect(() => goal.qualify()).toThrow(
        "Cannot approve goal in done status. Goal must be in-review."
      );
    });
  });

  describe("reset()", () => {
    it("should reset IN_REFINEMENT goal back to DEFINED", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });

      const event = goal.reset();

      expect(event.type).toBe(GoalEventType.RESET);
      expect(event.payload.status).toBe(GoalStatus.TODO);
      expect(goal.snapshot.status).toBe(GoalStatus.TODO);
    });

    it("should reset DOING goal back to REFINED (default entry point)", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      const event = goal.reset();

      expect(event.type).toBe(GoalEventType.RESET);
      expect(event.payload.status).toBe(GoalStatus.REFINED);
      expect(goal.snapshot.status).toBe(GoalStatus.REFINED);
    });

    it("should reset DOING goal back to REJECTED when entered from rejected", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();
      goal.reject("Failing tests");
      // Start from rejected state
      goal.start();

      const event = goal.reset();

      expect(event.payload.status).toBe(GoalStatus.REJECTED);
      expect(goal.snapshot.status).toBe(GoalStatus.REJECTED);
    });

    it("should reset DOING goal back to UNBLOCKED when entered from unblocked", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Waiting for dependency");
      goal.unblock("Dependency resolved");
      // Start from unblocked state
      goal.start();

      const event = goal.reset();

      expect(event.payload.status).toBe(GoalStatus.UNBLOCKED);
      expect(goal.snapshot.status).toBe(GoalStatus.UNBLOCKED);
    });

    it("should reset IN_REVIEW goal back to SUBMITTED", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();

      const event = goal.reset();

      expect(event.payload.status).toBe(GoalStatus.SUBMITTED);
      expect(goal.snapshot.status).toBe(GoalStatus.SUBMITTED);
    });

    it("should reset CODIFYING goal back to APPROVED", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();
      goal.approve();
      goal.codify({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });

      const event = goal.reset();

      expect(event.payload.status).toBe(GoalStatus.QUALIFIED);
      expect(goal.snapshot.status).toBe(GoalStatus.QUALIFIED);
    });

    it("should reset DONE goal back to APPROVED", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();
      goal.approve();
      goal.codify({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.close();

      const event = goal.reset();

      expect(event.payload.status).toBe(GoalStatus.QUALIFIED);
      expect(goal.snapshot.status).toBe(GoalStatus.QUALIFIED);
    });

    it("should throw error when resetting a BLOCKED goal", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.block("Waiting for dependency");

      expect(() => goal.reset()).toThrow(
        "Cannot reset a blocked goal. Unblock it first to preserve blocker context."
      );
    });

    it("should throw error when resetting a DEFINED goal (waiting state)", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);

      expect(() => goal.reset()).toThrow(
        "Cannot reset goal. Goal is already in waiting state"
      );
    });

    it("should throw error when resetting a REFINED goal (waiting state)", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();

      expect(() => goal.reset()).toThrow(
        "Cannot reset goal. Goal is already in waiting state"
      );
    });

    it("should throw error when resetting a SUBMITTED goal (waiting state)", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();

      expect(() => goal.reset()).toThrow(
        "Cannot reset goal. Goal is already in waiting state"
      );
    });

    it("should throw error when resetting an APPROVED goal (waiting state)", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.submit();
      goal.submitForReview();
      goal.approve();

      expect(() => goal.reset()).toThrow(
        "Cannot reset goal. Goal is already in waiting state"
      );
    });

    it("should throw error when resetting a PAUSED goal (waiting state)", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");

      expect(() => goal.reset()).toThrow(
        "Cannot reset goal. Goal is already in waiting state"
      );
    });

    it("should clear lastWaitingStatus on reset", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();

      // Reset from DOING to REFINED
      goal.reset();
      expect(goal.snapshot.lastWaitingStatus).toBeUndefined();
    });

    it("should preserve lastWaitingStatus through pause/resume cycle", () => {
      const goal = Goal.create("goal_123");
      goal.add("Auth feature", "Implement authentication", ["Users can log in"]);
      goal.refine({
        claimedBy: "worker_test",
        claimedAt: "2025-01-01T00:00:00Z",
        claimExpiresAt: "2025-01-01T01:00:00Z",
      });
      goal.commit();
      goal.start();
      goal.pause("ContextCompressed");
      goal.resume();

      // After pause/resume, should still reset to REFINED (not PAUSED)
      const event = goal.reset();
      expect(event.payload.status).toBe(GoalStatus.REFINED);
    });
  });
});
