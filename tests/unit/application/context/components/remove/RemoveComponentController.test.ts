import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RemoveComponentController } from "../../../../../../src/application/context/components/remove/RemoveComponentController.js";
import { IRemoveComponentGateway } from "../../../../../../src/application/context/components/remove/IRemoveComponentGateway.js";

describe("RemoveComponentController", () => {
  let controller: RemoveComponentController;
  let mockGateway: jest.Mocked<IRemoveComponentGateway>;

  beforeEach(() => {
    mockGateway = {
      removeComponent: jest.fn(),
    } as jest.Mocked<IRemoveComponentGateway>;

    controller = new RemoveComponentController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      componentId: "component-123",
    };

    const expectedResponse = {
      componentId: "component-123",
      name: "OldService",
      status: "removed",
    };

    mockGateway.removeComponent.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeComponent).toHaveBeenCalledWith(request);
  });
});
