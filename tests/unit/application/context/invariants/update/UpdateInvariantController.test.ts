import { UpdateInvariantController } from "../../../../../../src/application/context/invariants/update/UpdateInvariantController";
import { IUpdateInvariantGateway } from "../../../../../../src/application/context/invariants/update/IUpdateInvariantGateway";
import { jest } from "@jest/globals";

describe("UpdateInvariantController", () => {
  let controller: UpdateInvariantController;
  let mockGateway: jest.Mocked<IUpdateInvariantGateway>;

  beforeEach(() => {
    mockGateway = {
      updateInvariant: jest.fn(),
    } as jest.Mocked<IUpdateInvariantGateway>;

    controller = new UpdateInvariantController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      invariantId: "inv_001",
      title: "Updated Title",
    };

    const expectedResponse = {
      invariantId: "inv_001",
      updatedFields: ["title"],
      title: "Updated Title",
      version: 2,
    };

    mockGateway.updateInvariant.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateInvariant).toHaveBeenCalledWith(request);
  });
});
