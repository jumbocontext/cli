import { RelationDeactivationCascade } from "../../../../../../src/application/context/relations/deactivate/RelationDeactivationCascade.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { DeactivateRelationCommandHandler } from "../../../../../../src/application/context/relations/deactivate/DeactivateRelationCommandHandler.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { jest } from "@jest/globals";

describe("RelationDeactivationCascade", () => {
  let relationViewReader: jest.Mocked<IRelationViewReader>;
  let deactivateRelationCommandHandler: jest.Mocked<DeactivateRelationCommandHandler>;
  let cascade: RelationDeactivationCascade;

  beforeEach(() => {
    relationViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    deactivateRelationCommandHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DeactivateRelationCommandHandler>;
    cascade = new RelationDeactivationCascade(relationViewReader, deactivateRelationCommandHandler);
  });

  it("deactivates all active relations for the target entity", async () => {
    const relations: RelationView[] = [
      {
        relationId: "relation_1",
        fromEntityType: EntityType.DECISION,
        fromEntityId: "dec_1",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "comp_1",
        relationType: "depends-on",
        strength: null,
        description: "test-1",
        status: "active",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        relationId: "relation_2",
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal_1",
        toEntityType: EntityType.DECISION,
        toEntityId: "dec_1",
        relationType: "requires",
        strength: null,
        description: "test-2",
        status: "active",
        version: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    relationViewReader.findAll.mockResolvedValue(relations);

    const count = await cascade.execute(EntityType.DECISION, "dec_1", "Decision was reversed");

    expect(count).toBe(2);
    expect(relationViewReader.findAll).toHaveBeenCalledWith({
      entityType: EntityType.DECISION,
      entityId: "dec_1",
      status: "active",
    });
    expect(deactivateRelationCommandHandler.execute).toHaveBeenCalledTimes(2);
    expect(deactivateRelationCommandHandler.execute).toHaveBeenNthCalledWith(1, {
      relationId: "relation_1",
      reason: "Decision was reversed",
    });
    expect(deactivateRelationCommandHandler.execute).toHaveBeenNthCalledWith(2, {
      relationId: "relation_2",
      reason: "Decision was reversed",
    });
  });

  it("does nothing when there are no active relations", async () => {
    relationViewReader.findAll.mockResolvedValue([]);

    const count = await cascade.execute(EntityType.COMPONENT, "comp_1", "Component was deprecated");

    expect(count).toBe(0);
    expect(deactivateRelationCommandHandler.execute).not.toHaveBeenCalled();
  });
});
