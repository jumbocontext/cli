import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UndeprecateComponentController } from "../../../../../../src/application/context/components/undeprecate/UndeprecateComponentController.js";
import { IUndeprecateComponentGateway } from "../../../../../../src/application/context/components/undeprecate/IUndeprecateComponentGateway.js";

describe("UndeprecateComponentController", () => {
  let controller: UndeprecateComponentController;
  let mockGateway: jest.Mocked<IUndeprecateComponentGateway>;

  beforeEach(() => {
    mockGateway = {
      undeprecateComponent: jest.fn(),
    } as jest.Mocked<IUndeprecateComponentGateway>;

    controller = new UndeprecateComponentController(mockGateway);
  });

  it("delegates to gateway and returns response", async () => {
    const request = { componentId: "comp_123", reason: "Still required" };
    const expectedResponse = {
      componentId: "comp_123",
      name: "LegacyService",
      status: "active",
      reason: "Still required",
    };

    mockGateway.undeprecateComponent.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.undeprecateComponent).toHaveBeenCalledWith(request);
  });
});
