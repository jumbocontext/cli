import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddComponentController } from "../../../../../../src/application/context/components/add/AddComponentController.js";
import { IAddComponentGateway } from "../../../../../../src/application/context/components/add/IAddComponentGateway.js";

describe("AddComponentController", () => {
  let controller: AddComponentController;
  let mockGateway: jest.Mocked<IAddComponentGateway>;

  beforeEach(() => {
    mockGateway = {
      addComponent: jest.fn(),
    } as jest.Mocked<IAddComponentGateway>;

    controller = new AddComponentController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      name: "UserController",
      type: "service" as const,
      description: "Handles user-related HTTP requests",
      responsibility: "User authentication and profile management",
      path: "src/api/user-controller.ts",
    };

    const expectedResponse = {
      componentId: "component-123",
      name: "UserController",
      type: "service",
      path: "src/api/user-controller.ts",
      status: "active",
      isUpdate: false,
    };

    mockGateway.addComponent.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addComponent).toHaveBeenCalledWith(request);
  });
});
