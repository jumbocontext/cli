import { LocalRemoveRelationGateway } from "../../../../../../src/application/context/relations/remove/LocalRemoveRelationGateway";
import { RemoveRelationCommandHandler } from "../../../../../../src/application/context/relations/remove/RemoveRelationCommandHandler";
import { IRelationRemovedReader } from "../../../../../../src/application/context/relations/remove/IRelationRemovedReader";
import { EntityType } from "../../../../../../src/domain/relations/Constants";
import { jest } from "@jest/globals";

describe("LocalRemoveRelationGateway", () => {
  let gateway: LocalRemoveRelationGateway;
  let mockCommandHandler: jest.Mocked<Pick<RemoveRelationCommandHandler, "execute">>;
  let mockReader: jest.Mocked<IRelationRemovedReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    };
    mockReader = {
      findById: jest.fn(),
    };

    gateway = new LocalRemoveRelationGateway(
      mockCommandHandler as unknown as RemoveRelationCommandHandler,
      mockReader
    );
  });

  it("should fetch relation details, execute command, and return response with relation info", async () => {
    mockReader.findById.mockResolvedValue({
      relationId: "rel_abc123",
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "comp_456",
      relationType: "involves",
      strength: null,
      description: "Goal involves component",
      status: "active",
      version: 1,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    mockCommandHandler.execute.mockResolvedValue(undefined);

    const response = await gateway.removeRelation({
      relationId: "rel_abc123",
      reason: "No longer needed",
    });

    expect(response).toEqual({
      relationId: "rel_abc123",
      from: "goal:goal_123",
      relationType: "involves",
      to: "component:comp_456",
    });
    expect(mockReader.findById).toHaveBeenCalledWith("rel_abc123");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      relationId: "rel_abc123",
      reason: "No longer needed",
    });
  });

  it("should return minimal response when relation not found pre-removal", async () => {
    mockReader.findById.mockResolvedValue(null);
    mockCommandHandler.execute.mockResolvedValue(undefined);

    const response = await gateway.removeRelation({
      relationId: "rel_abc123",
    });

    expect(response).toEqual({
      relationId: "rel_abc123",
    });
  });

  it("should propagate command handler errors", async () => {
    mockReader.findById.mockResolvedValue(null);
    mockCommandHandler.execute.mockRejectedValue(new Error("Relation not found"));

    await expect(gateway.removeRelation({
      relationId: "rel_abc123",
    })).rejects.toThrow("Relation not found");
  });
});
