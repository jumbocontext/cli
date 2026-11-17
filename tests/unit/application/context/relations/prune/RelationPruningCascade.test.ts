import { RelationPruningCascade } from "../../../../../../src/application/context/relations/prune/RelationPruningCascade.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { RemoveRelationCommandHandler } from "../../../../../../src/application/context/relations/remove/RemoveRelationCommandHandler.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { jest } from "@jest/globals";

describe("RelationPruningCascade", () => {
  let relationViewReader: jest.Mocked<IRelationViewReader>;
  let removeRelationCommandHandler: jest.Mocked<RemoveRelationCommandHandler>;
  let cascade: RelationPruningCascade;

  beforeEach(() => {
    relationViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    removeRelationCommandHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RemoveRelationCommandHandler>;
    cascade = new RelationPruningCascade(relationViewReader, removeRelationCommandHandler);
  });

  it("prunes all non-removed relations for the target entity across statuses", async () => {
    const relations: RelationView[] = [
      createRelation("relation_1", "active"),
      createRelation("relation_2", "deactivated"),
      createRelation("relation_3", "removed"),
    ];
    relationViewReader.findAll.mockResolvedValue(relations);

    const count = await cascade.execute(EntityType.COMPONENT, "comp_1", "Component was removed");

    expect(count).toBe(2);
    expect(relationViewReader.findAll).toHaveBeenCalledWith({
      entityType: EntityType.COMPONENT,
      entityId: "comp_1",
      status: "all",
    });
    expect(removeRelationCommandHandler.execute).toHaveBeenCalledTimes(2);
    expect(removeRelationCommandHandler.execute).toHaveBeenNthCalledWith(1, {
      relationId: "relation_1",
      reason: "Component was removed",
    });
    expect(removeRelationCommandHandler.execute).toHaveBeenNthCalledWith(2, {
      relationId: "relation_2",
      reason: "Component was removed",
    });
  });

  it("does nothing when there are no relations", async () => {
    relationViewReader.findAll.mockResolvedValue([]);

    const count = await cascade.execute(EntityType.GOAL, "goal_1", "Goal was removed");

    expect(count).toBe(0);
    expect(removeRelationCommandHandler.execute).not.toHaveBeenCalled();
  });

  it("propagates errors from the command handler", async () => {
    relationViewReader.findAll.mockResolvedValue([createRelation("relation_1", "active")]);
    removeRelationCommandHandler.execute.mockRejectedValue(new Error("remove failed"));

    await expect(
      cascade.execute(EntityType.COMPONENT, "comp_1", "Component was removed")
    ).rejects.toThrow("remove failed");
  });

  function createRelation(
    relationId: string,
    status: RelationView["status"]
  ): RelationView {
    return {
      relationId,
      fromEntityType: EntityType.COMPONENT,
      fromEntityId: "comp_1",
      toEntityType: EntityType.GOAL,
      toEntityId: "goal_1",
      relationType: "involves",
      strength: null,
      description: "test",
      status,
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
  }
});
