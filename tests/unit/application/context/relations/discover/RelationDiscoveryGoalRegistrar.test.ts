import { RelationDiscoveryGoalRegistrar } from "../../../../../../src/application/context/relations/discover/RelationDiscoveryGoalRegistrar.js";
import { IGoalTitleReader } from "../../../../../../src/application/context/goals/IGoalTitleReader.js";
import { AddGoalCommandHandler } from "../../../../../../src/application/context/goals/add/AddGoalCommandHandler.js";
import { ILogger } from "../../../../../../src/application/logging/ILogger.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";
import { jest } from "@jest/globals";

describe("RelationDiscoveryGoalRegistrar", () => {
  let goalTitleReader: jest.Mocked<IGoalTitleReader>;
  let addGoalCommandHandler: jest.Mocked<AddGoalCommandHandler>;
  let logger: jest.Mocked<ILogger>;
  let registrar: RelationDiscoveryGoalRegistrar;

  beforeEach(() => {
    goalTitleReader = {
      findByTitle: jest.fn().mockResolvedValue(null),
    };
    addGoalCommandHandler = {
      execute: jest.fn().mockResolvedValue({ goalId: "goal_new_123" }),
    } as unknown as jest.Mocked<AddGoalCommandHandler>;
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    registrar = new RelationDiscoveryGoalRegistrar(goalTitleReader, addGoalCommandHandler, logger);
  });

  it("registers a relation-discovery goal for a new component", async () => {
    const goalId = await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(goalId).toBe("goal_new_123");
    expect(goalTitleReader.findByTitle).toHaveBeenCalledWith("Discover relations for component comp_1");
    expect(addGoalCommandHandler.execute).toHaveBeenCalledWith({
      title: "Discover relations for component comp_1",
      objective: expect.stringContaining("Search defined and refined goals for valid relations"),
      successCriteria: expect.arrayContaining([
        expect.stringContaining("component 'comp_1'"),
      ]),
    });
  });

  it("registers a relation-discovery goal for a new decision", async () => {
    const goalId = await registrar.execute(EntityType.DECISION, "dec_1");

    expect(goalId).toBe("goal_new_123");
    expect(addGoalCommandHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Discover relations for decision dec_1",
      })
    );
  });

  it("registers a relation-discovery goal for a new dependency", async () => {
    const goalId = await registrar.execute(EntityType.DEPENDENCY, "dep_1");

    expect(goalId).toBe("goal_new_123");
    expect(addGoalCommandHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Discover relations for dependency dep_1",
      })
    );
  });

  it("registers a relation-discovery goal for a new guideline", async () => {
    const goalId = await registrar.execute(EntityType.GUIDELINE, "guide_1");

    expect(goalId).toBe("goal_new_123");
    expect(addGoalCommandHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Discover relations for guideline guide_1",
      })
    );
  });

  it("registers a relation-discovery goal for a new invariant", async () => {
    const goalId = await registrar.execute(EntityType.INVARIANT, "inv_1");

    expect(goalId).toBe("goal_new_123");
    expect(addGoalCommandHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Discover relations for invariant inv_1",
      })
    );
  });

  it("skips registration when a relation-discovery goal already exists for the entity", async () => {
    goalTitleReader.findByTitle.mockResolvedValue({
      goalId: "existing_goal",
      title: "Discover relations for component comp_1",
      objective: "existing",
      successCriteria: [],
      status: "defined",
    } as GoalView);

    const goalId = await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(goalId).toBeNull();
    expect(addGoalCommandHandler.execute).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "Relation-discovery goal already exists, skipping registration",
      expect.objectContaining({ existingGoalId: "existing_goal" })
    );
  });

  it("does not duplicate when event fires twice for the same entity", async () => {
    await registrar.execute(EntityType.COMPONENT, "comp_1");
    expect(addGoalCommandHandler.execute).toHaveBeenCalledTimes(1);

    goalTitleReader.findByTitle.mockResolvedValue({
      goalId: "goal_new_123",
      title: "Discover relations for component comp_1",
      objective: "existing",
      successCriteria: [],
      status: "defined",
    } as GoalView);

    const secondResult = await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(secondResult).toBeNull();
    expect(addGoalCommandHandler.execute).toHaveBeenCalledTimes(1);
  });

  it("returns null without throwing when goal creation fails", async () => {
    (addGoalCommandHandler.execute as jest.Mock).mockRejectedValue(new Error("Event store failure"));

    const goalId = await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(goalId).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to register relation-discovery goal",
      expect.any(Error),
      expect.objectContaining({ entityType: "component", entityId: "comp_1" })
    );
  });

  it("returns null without throwing when title reader fails", async () => {
    goalTitleReader.findByTitle.mockRejectedValue(new Error("DB failure"));

    const goalId = await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(goalId).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it("logs debug when checking for existing goal", async () => {
    await registrar.execute(EntityType.DECISION, "dec_1");

    expect(logger.debug).toHaveBeenCalledWith(
      "Checking for existing relation-discovery goal",
      expect.objectContaining({ entityType: "decision", entityId: "dec_1" })
    );
  });

  it("logs info when goal is successfully registered", async () => {
    await registrar.execute(EntityType.COMPONENT, "comp_1");

    expect(logger.info).toHaveBeenCalledWith(
      "Relation-discovery goal registered",
      expect.objectContaining({ entityType: "component", entityId: "comp_1", goalId: "goal_new_123" })
    );
  });
});
