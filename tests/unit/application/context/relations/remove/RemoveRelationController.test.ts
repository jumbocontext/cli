import { RemoveRelationController } from "../../../../../../src/application/context/relations/remove/RemoveRelationController";
import { IRemoveRelationGateway } from "../../../../../../src/application/context/relations/remove/IRemoveRelationGateway";
import { jest } from "@jest/globals";

describe("RemoveRelationController", () => {
  let controller: RemoveRelationController;
  let mockGateway: jest.Mocked<IRemoveRelationGateway>;

  beforeEach(() => {
    mockGateway = {
      removeRelation: jest.fn(),
    } as jest.Mocked<IRemoveRelationGateway>;

    controller = new RemoveRelationController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      relationId: "rel_abc123",
      reason: "No longer needed",
    };
    const expectedResponse = {
      relationId: "rel_abc123",
      from: "goal:goal_123",
      relationType: "involves",
      to: "component:comp_456",
    };

    mockGateway.removeRelation.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeRelation).toHaveBeenCalledWith(request);
  });

  it("should propagate gateway errors", async () => {
    const request = {
      relationId: "rel_abc123",
    };
    mockGateway.removeRelation.mockRejectedValue(new Error("Gateway failure"));

    await expect(controller.handle(request)).rejects.toThrow("Gateway failure");
  });
});
