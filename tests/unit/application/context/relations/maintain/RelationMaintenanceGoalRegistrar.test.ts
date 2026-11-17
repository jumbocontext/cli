import { RelationMaintenanceGoalRegistrar } from "../../../../../../src/application/context/relations/maintain/RelationMaintenanceGoalRegistrar.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { AddGoalCommandHandler } from "../../../../../../src/application/context/goals/add/AddGoalCommandHandler.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { jest } from "@jest/globals";

describe("RelationMaintenanceGoalRegistrar", () => {
  let relationViewReader: jest.Mocked<IRelationViewReader>;
  let addGoalCommandHandler: jest.Mocked<AddGoalCommandHandler>;
  let registrar: RelationMaintenanceGoalRegistrar;

  beforeEach(() => {
    relationViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    addGoalCommandHandler = {
      execute: jest.fn().mockResolvedValue({ goalId: "goal_new_123" }),
    } as unknown as jest.Mocked<AddGoalCommandHandler>;
    registrar = new RelationMaintenanceGoalRegistrar(relationViewReader, addGoalCommandHandler);
  });

  it("registers a maintenance goal when active relations exist", async () => {
    const relations: RelationView[] = [
      {
        relationId: "relation_1",
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: "comp_1",
        toEntityType: EntityType.DECISION,
        toEntityId: "dec_1",
        relationType: "implements",
        strength: null,
        description: "test relation",
        status: "active",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    relationViewReader.findAll.mockResolvedValue(relations);

    const goalId = await registrar.execute(EntityType.COMPONENT, "comp_1", "component was updated");

    expect(goalId).toBe("goal_new_123");
    expect(relationViewReader.findAll).toHaveBeenCalledWith({
      entityType: EntityType.COMPONENT,
      entityId: "comp_1",
      status: "active",
    });
    expect(addGoalCommandHandler.execute).toHaveBeenCalledWith({
      title: "Update relations for component comp_1",
      objective: expect.stringContaining("component was updated"),
      successCriteria: [
        expect.stringContaining("Symmetry between the updated component and its relations"),
      ],
    });
  });

  it("includes related entity identifiers in the goal objective", async () => {
    const relations: RelationView[] = [
      {
        relationId: "relation_1",
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: "comp_1",
        toEntityType: EntityType.DECISION,
        toEntityId: "dec_1",
        relationType: "implements",
        strength: null,
        description: "test",
        status: "active",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        relationId: "relation_2",
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal_1",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "comp_1",
        relationType: "modifies",
        strength: null,
        description: "test",
        status: "active",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    relationViewReader.findAll.mockResolvedValue(relations);

    await registrar.execute(EntityType.COMPONENT, "comp_1", "component was updated");

    const call = addGoalCommandHandler.execute.mock.calls[0][0];
    expect(call.objective).toContain("decision:dec_1");
    expect(call.objective).toContain("goal:goal_1");
    expect(call.objective).toContain("2 active relation(s)");
  });

  it("returns null and does not create a goal when no active relations exist", async () => {
    relationViewReader.findAll.mockResolvedValue([]);

    const goalId = await registrar.execute(EntityType.GUIDELINE, "guide_1", "guideline was updated");

    expect(goalId).toBeNull();
    expect(addGoalCommandHandler.execute).not.toHaveBeenCalled();
  });

  it("returns null without throwing when goal creation fails", async () => {
    const relations: RelationView[] = [
      {
        relationId: "relation_1",
        fromEntityType: EntityType.COMPONENT,
        fromEntityId: "comp_1",
        toEntityType: EntityType.DECISION,
        toEntityId: "dec_1",
        relationType: "implements",
        strength: null,
        description: "test",
        status: "active",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    relationViewReader.findAll.mockResolvedValue(relations);
    (addGoalCommandHandler.execute as jest.Mock).mockRejectedValue(new Error("Event store failure"));

    const goalId = await registrar.execute(EntityType.COMPONENT, "comp_1", "component was updated");

    expect(goalId).toBeNull();
  });
});
