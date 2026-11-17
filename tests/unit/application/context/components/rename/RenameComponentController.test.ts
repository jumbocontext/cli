import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RenameComponentController } from "../../../../../../src/application/context/components/rename/RenameComponentController.js";
import { IRenameComponentGateway } from "../../../../../../src/application/context/components/rename/IRenameComponentGateway.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("RenameComponentController", () => {
  let controller: RenameComponentController;
  let mockGateway: jest.Mocked<IRenameComponentGateway>;

  const componentId = "comp_test123";
  const mockView: ComponentView = {
    componentId,
    name: "NewName",
    type: "service",
    description: "A description",
    responsibility: "A responsibility",
    path: "src/test.ts",
    status: "active",
    deprecationReason: null,
    version: 2,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T11:00:00Z",
  };

  beforeEach(() => {
    mockGateway = {
      renameComponent: jest.fn(),
    } as jest.Mocked<IRenameComponentGateway>;

    controller = new RenameComponentController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.renameComponent.mockResolvedValue({ componentId, view: mockView });

    const response = await controller.handle({
      componentId,
      name: "NewName",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.view).toEqual(mockView);
    expect(mockGateway.renameComponent).toHaveBeenCalledWith({
      componentId,
      name: "NewName",
    });
  });
});
