import { RelationReactivationCascade } from "../../../../../../src/application/context/relations/reactivate/RelationReactivationCascade.js";
import { IRelationViewReader } from "../../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { ReactivateRelationCommandHandler } from "../../../../../../src/application/context/relations/reactivate/ReactivateRelationCommandHandler.js";
import { EntityType } from "../../../../../../src/domain/relations/Constants.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";
import { jest } from "@jest/globals";

describe("RelationReactivationCascade", () => {
  let relationViewReader: jest.Mocked<IRelationViewReader>;
  let reactivateRelationCommandHandler: jest.Mocked<ReactivateRelationCommandHandler>;
  let cascade: RelationReactivationCascade;

  beforeEach(() => {
    relationViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    reactivateRelationCommandHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ReactivateRelationCommandHandler>;
    cascade = new RelationReactivationCascade(relationViewReader, reactivateRelationCommandHandler);
  });

  it("reactivates all deactivated relations for the target entity", async () => {
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
        status: "deactivated",
        version: 2,
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
        status: "deactivated",
        version: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    relationViewReader.findAll.mockResolvedValue(relations);

    const count = await cascade.execute(EntityType.DECISION, "dec_1", "Decision was restored");

    expect(count).toBe(2);
    expect(relationViewReader.findAll).toHaveBeenCalledWith({
      entityType: EntityType.DECISION,
      entityId: "dec_1",
      status: "deactivated",
    });
    expect(reactivateRelationCommandHandler.execute).toHaveBeenCalledTimes(2);
    expect(reactivateRelationCommandHandler.execute).toHaveBeenNthCalledWith(1, {
      relationId: "relation_1",
      reason: "Decision was restored",
    });
    expect(reactivateRelationCommandHandler.execute).toHaveBeenNthCalledWith(2, {
      relationId: "relation_2",
      reason: "Decision was restored",
    });
  });

  it("does nothing when there are no deactivated relations", async () => {
    relationViewReader.findAll.mockResolvedValue([]);

    const count = await cascade.execute(EntityType.COMPONENT, "comp_1", "Component was undeprecated");

    expect(count).toBe(0);
    expect(reactivateRelationCommandHandler.execute).not.toHaveBeenCalled();
  });
});
