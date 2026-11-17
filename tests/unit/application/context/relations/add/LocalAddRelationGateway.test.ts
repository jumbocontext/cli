import { LocalAddRelationGateway } from "../../../../../../src/application/context/relations/add/LocalAddRelationGateway";
import { AddRelationCommandHandler } from "../../../../../../src/application/context/relations/add/AddRelationCommandHandler";
import { EntityType } from "../../../../../../src/domain/relations/Constants";
import { jest } from "@jest/globals";

describe("LocalAddRelationGateway", () => {
  let gateway: LocalAddRelationGateway;
  let mockCommandHandler: jest.Mocked<Pick<AddRelationCommandHandler, "execute">>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    };

    gateway = new LocalAddRelationGateway(
      mockCommandHandler as unknown as AddRelationCommandHandler
    );
  });

  it("should map request to command and delegate to handler", async () => {
    mockCommandHandler.execute.mockResolvedValue({ relationId: "relation_abc" });

    const request = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "comp_456",
      relationType: "involves",
      description: "Goal involves component",
    };

    const response = await gateway.addRelation(request);

    expect(response).toEqual({ relationId: "relation_abc" });
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "comp_456",
      relationType: "involves",
      description: "Goal involves component",
      strength: undefined,
    });
  });

  it("should pass optional strength parameter", async () => {
    mockCommandHandler.execute.mockResolvedValue({ relationId: "relation_abc" });

    const request = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.INVARIANT,
      toEntityId: "inv_789",
      relationType: "must-respect",
      description: "Must respect invariant",
      strength: "strong" as const,
    };

    await gateway.addRelation(request);

    expect(mockCommandHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({ strength: "strong" })
    );
  });

  it("should propagate command handler errors", async () => {
    mockCommandHandler.execute.mockRejectedValue(new Error("Duplicate relation"));

    const request = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "comp_456",
      relationType: "involves",
      description: "Goal involves component",
    };

    await expect(gateway.addRelation(request)).rejects.toThrow("Duplicate relation");
  });
});
