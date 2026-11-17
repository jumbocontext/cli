import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRenameComponentGateway } from "../../../../../../src/application/context/components/rename/LocalRenameComponentGateway.js";
import { RenameComponentCommandHandler } from "../../../../../../src/application/context/components/rename/RenameComponentCommandHandler.js";
import { IComponentRenameReader } from "../../../../../../src/application/context/components/rename/IComponentRenameReader.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("LocalRenameComponentGateway", () => {
  let gateway: LocalRenameComponentGateway;
  let mockCommandHandler: jest.Mocked<RenameComponentCommandHandler>;
  let mockReader: jest.Mocked<IComponentRenameReader>;

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
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RenameComponentCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IComponentRenameReader>;

    gateway = new LocalRenameComponentGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return renamed view", async () => {
    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue(mockView);

    const response = await gateway.renameComponent({
      componentId,
      name: "NewName",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.view).toEqual(mockView);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      componentId,
      name: "NewName",
    });
    expect(mockReader.findById).toHaveBeenCalledWith(componentId);
  });

  it("should return null view when reader returns null", async () => {
    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.renameComponent({
      componentId,
      name: "NewName",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.view).toBeNull();
  });
});
