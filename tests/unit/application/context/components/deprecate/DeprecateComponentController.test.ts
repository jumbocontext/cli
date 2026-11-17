import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { DeprecateComponentController } from "../../../../../../src/application/context/components/deprecate/DeprecateComponentController.js";
import { IDeprecateComponentGateway } from "../../../../../../src/application/context/components/deprecate/IDeprecateComponentGateway.js";

describe("DeprecateComponentController", () => {
  let controller: DeprecateComponentController;
  let mockGateway: jest.Mocked<IDeprecateComponentGateway>;

  beforeEach(() => {
    mockGateway = {
      deprecateComponent: jest.fn(),
    } as jest.Mocked<IDeprecateComponentGateway>;

    controller = new DeprecateComponentController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      componentId: "component-123",
      reason: "Replaced by NewAuthMiddleware",
    };

    const expectedResponse = {
      componentId: "component-123",
      name: "AuthMiddleware",
      status: "deprecated",
      reason: "Replaced by NewAuthMiddleware",
    };

    mockGateway.deprecateComponent.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.deprecateComponent).toHaveBeenCalledWith(request);
  });
});
