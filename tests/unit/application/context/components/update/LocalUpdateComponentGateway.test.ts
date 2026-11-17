import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateComponentGateway } from "../../../../../../src/application/context/components/update/LocalUpdateComponentGateway.js";
import { UpdateComponentCommandHandler } from "../../../../../../src/application/context/components/update/UpdateComponentCommandHandler.js";
import { IComponentUpdateReader } from "../../../../../../src/application/context/components/update/IComponentUpdateReader.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";

describe("LocalUpdateComponentGateway", () => {
  let gateway: LocalUpdateComponentGateway;
  let mockCommandHandler: jest.Mocked<UpdateComponentCommandHandler>;
  let mockReader: jest.Mocked<IComponentUpdateReader>;

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
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateComponentCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IComponentUpdateReader>;

    gateway = new LocalUpdateComponentGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return updated view", async () => {
    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue(mockView);

    const response = await gateway.updateComponent({
      componentId,
      description: "Updated description",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.view).toEqual(mockView);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      componentId,
      description: "Updated description",
      responsibility: undefined,
      path: undefined,
      type: undefined,
    });
    expect(mockReader.findById).toHaveBeenCalledWith(componentId);
  });

  it("should pass all fields to command handler", async () => {
    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue(mockView);

    await gateway.updateComponent({
      componentId,
      description: "New description",
      responsibility: "New responsibility",
      path: "src/new.ts",
      type: "api",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      componentId,
      description: "New description",
      responsibility: "New responsibility",
      path: "src/new.ts",
      type: "api",
    });
  });

  it("should return null view when reader returns null", async () => {
    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.updateComponent({
      componentId,
      description: "Updated description",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.view).toBeNull();
  });
});
