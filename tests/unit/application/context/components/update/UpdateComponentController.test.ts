import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateComponentController } from "../../../../../../src/application/context/components/update/UpdateComponentController.js";
import { IUpdateComponentGateway } from "../../../../../../src/application/context/components/update/IUpdateComponentGateway.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("UpdateComponentController", () => {
  let controller: UpdateComponentController;
  let mockGateway: jest.Mocked<IUpdateComponentGateway>;

  const componentId = "comp_test123";
  const mockView: ComponentView = {
    componentId,
    name: "TestComponent",
    type: "service",
    description: "Updated description",
    responsibility: "Test responsibility",
    path: "src/test.ts",
    status: "active",
    deprecationReason: null,
    version: 2,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T11:00:00Z",
  };

  beforeEach(() => {
    mockGateway = {
      updateComponent: jest.fn(),
    } as jest.Mocked<IUpdateComponentGateway>;

    controller = new UpdateComponentController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.updateComponent.mockResolvedValue({ componentId, view: mockView });

    const response = await controller.handle({
      componentId,
      description: "Updated description",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.view).toEqual(mockView);
    expect(mockGateway.updateComponent).toHaveBeenCalledWith({
      componentId,
      description: "Updated description",
    });
  });

  it("should pass all request fields through to gateway", async () => {
    mockGateway.updateComponent.mockResolvedValue({ componentId, view: mockView });

    await controller.handle({
      componentId,
      description: "New description",
      responsibility: "New responsibility",
      path: "src/new.ts",
      type: "api",
    });

    expect(mockGateway.updateComponent).toHaveBeenCalledWith({
      componentId,
      description: "New description",
      responsibility: "New responsibility",
      path: "src/new.ts",
      type: "api",
    });
  });
});
