import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetRelationsController } from "../../../../../../src/application/context/relations/get/GetRelationsController.js";
import { IGetRelationsGateway } from "../../../../../../src/application/context/relations/get/IGetRelationsGateway.js";
import { RelationView } from "../../../../../../src/application/context/relations/RelationView.js";

describe("GetRelationsController", () => {
  let controller: GetRelationsController;
  let mockGateway: jest.Mocked<IGetRelationsGateway>;

  beforeEach(() => {
    mockGateway = {
      getRelations: jest.fn(),
    } as jest.Mocked<IGetRelationsGateway>;

    controller = new GetRelationsController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockRelations: RelationView[] = [
      {
        relationId: "rel_123",
        fromEntityType: "goal",
        fromEntityId: "goal_456",
        toEntityType: "decision",
        toEntityId: "dec_789",
        relationType: "requires",
        strength: "strong",
        description: "Goal requires this decision",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGateway.getRelations.mockResolvedValue({ relations: mockRelations });

    const response = await controller.handle({ status: "active" });

    expect(response.relations).toEqual(mockRelations);
    expect(mockGateway.getRelations).toHaveBeenCalledWith({ status: "active" });
  });

  it("should pass all filter fields through to gateway", async () => {
    mockGateway.getRelations.mockResolvedValue({ relations: [] });

    await controller.handle({
      entityType: "goal",
      entityId: "goal_123",
      direction: "in",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "medium",
      status: "all",
    });

    expect(mockGateway.getRelations).toHaveBeenCalledWith({
      entityType: "goal",
      entityId: "goal_123",
      direction: "in",
      relationType: "requires",
      relatedEntityType: "component",
      strength: "medium",
      status: "all",
    });
  });
});
