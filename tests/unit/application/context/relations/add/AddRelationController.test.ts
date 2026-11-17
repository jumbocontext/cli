import { AddRelationController } from "../../../../../../src/application/context/relations/add/AddRelationController";
import { IAddRelationGateway } from "../../../../../../src/application/context/relations/add/IAddRelationGateway";
import { EntityType } from "../../../../../../src/domain/relations/Constants";
import { jest } from "@jest/globals";

describe("AddRelationController", () => {
  let controller: AddRelationController;
  let mockGateway: jest.Mocked<IAddRelationGateway>;

  beforeEach(() => {
    mockGateway = {
      addRelation: jest.fn(),
    } as jest.Mocked<IAddRelationGateway>;

    controller = new AddRelationController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "comp_456",
      relationType: "involves",
      description: "Goal involves component",
    };
    const expectedResponse = { relationId: "relation_abc" };

    mockGateway.addRelation.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addRelation).toHaveBeenCalledWith(request);
  });

  it("should propagate gateway errors", async () => {
    const request = {
      fromEntityType: EntityType.GOAL,
      fromEntityId: "goal_123",
      toEntityType: EntityType.COMPONENT,
      toEntityId: "comp_456",
      relationType: "involves",
      description: "Goal involves component",
    };
    mockGateway.addRelation.mockRejectedValue(new Error("Gateway failure"));

    await expect(controller.handle(request)).rejects.toThrow("Gateway failure");
  });
});
