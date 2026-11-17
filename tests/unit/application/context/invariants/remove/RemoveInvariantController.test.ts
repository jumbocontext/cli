import { RemoveInvariantController } from "../../../../../../src/application/context/invariants/remove/RemoveInvariantController";
import { IRemoveInvariantGateway } from "../../../../../../src/application/context/invariants/remove/IRemoveInvariantGateway";
import { jest } from "@jest/globals";

describe("RemoveInvariantController", () => {
  let controller: RemoveInvariantController;
  let mockGateway: jest.Mocked<IRemoveInvariantGateway>;

  beforeEach(() => {
    mockGateway = {
      removeInvariant: jest.fn(),
    } as jest.Mocked<IRemoveInvariantGateway>;

    controller = new RemoveInvariantController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      invariantId: "inv_001",
    };

    const expectedResponse = {
      invariantId: "inv_001",
      title: "All IDs must be UUIDs",
    };

    mockGateway.removeInvariant.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeInvariant).toHaveBeenCalledWith(request);
  });
});
