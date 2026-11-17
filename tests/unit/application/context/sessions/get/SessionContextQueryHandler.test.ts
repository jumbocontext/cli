import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionContextQueryHandler } from "../../../../../../src/application/context/sessions/get/SessionContextQueryHandler.js";
import { ISessionViewReader } from "../../../../../../src/application/context/sessions/get/ISessionViewReader.js";
import { IGoalStatusReader } from "../../../../../../src/application/context/goals/IGoalStatusReader.js";
import { IDecisionViewReader } from "../../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { IProjectContextReader } from "../../../../../../src/application/context/project/query/IProjectContextReader.js";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";
import { SessionView } from "../../../../../../src/application/context/sessions/SessionView.js";
import { ProjectView } from "../../../../../../src/application/context/project/ProjectView.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";

describe("SessionContextQueryHandler", () => {
  let sessionViewReader: jest.Mocked<ISessionViewReader>;
  let goalStatusReader: jest.Mocked<IGoalStatusReader>;
  let decisionViewReader: jest.Mocked<IDecisionViewReader>;
  let projectContextReader: jest.Mocked<IProjectContextReader>;

  beforeEach(() => {
    sessionViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
      findActive: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<ISessionViewReader>;

    goalStatusReader = {
      findByStatus: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IGoalStatusReader>;

    decisionViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
      search: jest.fn().mockResolvedValue([]),
    } as jest.Mocked<IDecisionViewReader>;

    projectContextReader = {
      getProject: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IProjectContextReader>;

  });

  function createHandler(): SessionContextQueryHandler {
    return new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader,
      projectContextReader
    );
  }

  it("should return null session when no active session exists", async () => {
    const handler = createHandler();
    const result = await handler.execute();

    expect(result.session).toBeNull();
  });

  it("should return session from active session", async () => {
    const activeSession: SessionView = {
      sessionId: "session-1",
      status: "active",
      focus: "Test focus",
      contextSnapshot: null,
      version: 1,
      startedAt: "2025-01-01T10:00:00Z",
      endedAt: null,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    };
    sessionViewReader.findActive.mockResolvedValue(activeSession);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.session).toBe(activeSession);
    expect(result.session?.sessionId).toBe("session-1");
    expect(result.session?.status).toBe("active");
    expect(result.session?.focus).toBe("Test focus");
    expect(result.session?.startedAt).toBe("2025-01-01T10:00:00Z");
  });

  it("should return null projectContext when no project exists", async () => {
    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.projectContext).toBeNull();
  });

  it("should assemble core projectContext without north-star data", async () => {
    const project = {
      projectId: "11111111-1111-4111-8111-111111111111",
      name: "TestProject",
      purpose: "Testing",
    };

    projectContextReader.getProject.mockResolvedValue(project as unknown as ProjectView);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.projectContext).toBe(project);
    expect(result.context.projectContext?.projectId).toBe(project.projectId);
  });

  it("should separate doing, blocked, in-review, and qualified goals as activeGoals", async () => {
    const doingGoal = { goalId: "g1", status: GoalStatus.DOING } as GoalView;
    const blockedGoal = { goalId: "g2", status: GoalStatus.BLOCKED } as GoalView;
    const inReviewGoal = { goalId: "g3", status: GoalStatus.INREVIEW } as GoalView;
    const qualifiedGoal = { goalId: "g4", status: GoalStatus.QUALIFIED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      switch (status) {
        case GoalStatus.DOING: return [doingGoal];
        case GoalStatus.BLOCKED: return [blockedGoal];
        case GoalStatus.INREVIEW: return [inReviewGoal];
        case GoalStatus.QUALIFIED: return [qualifiedGoal];
        default: return [];
      }
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.activeGoals).toEqual([doingGoal, blockedGoal, inReviewGoal, qualifiedGoal]);
  });

  it("should return paused goals separately", async () => {
    const pausedGoal = { goalId: "g1", status: GoalStatus.PAUSED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      if (status === GoalStatus.PAUSED) return [pausedGoal];
      return [];
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.pausedGoals).toEqual([pausedGoal]);
    expect(result.context.activeGoals).toEqual([]);
  });

  it("should combine todo and refined goals as plannedGoals", async () => {
    const todoGoal = { goalId: "g1", status: GoalStatus.TODO } as GoalView;
    const refinedGoal = { goalId: "g2", status: GoalStatus.REFINED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      if (status === GoalStatus.TODO) return [todoGoal];
      if (status === GoalStatus.REFINED) return [refinedGoal];
      return [];
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.plannedGoals).toEqual([todoGoal, refinedGoal]);
  });

  it("should return recent active decisions", async () => {
    const decisions = [
      { decisionId: "d1", title: "Decision 1", createdAt: "2025-01-02T00:00:00Z" },
      { decisionId: "d2", title: "Decision 2", createdAt: "2025-01-01T00:00:00Z" },
    ];
    decisionViewReader.findAll.mockResolvedValue(decisions as unknown as DecisionView[]);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.recentDecisions).toHaveLength(2);
    expect(result.context.recentDecisions[0].decisionId).toBe("d1");
    expect(decisionViewReader.findAll).toHaveBeenCalledWith("active");
  });

  it("should limit recent decisions to 10", async () => {
    const decisions = Array.from({ length: 15 }, (_, i) => ({
      decisionId: `d${i}`,
      title: `Decision ${i}`,
      createdAt: `2025-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    }));
    decisionViewReader.findAll.mockResolvedValue(decisions as unknown as DecisionView[]);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.recentDecisions).toHaveLength(3);
  });

  it("should handle missing optional readers gracefully", async () => {
    const handler = new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader
    );

    const result = await handler.execute();

    expect(result.context.projectContext).toBeNull();
  });
});
