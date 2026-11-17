import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRemoveComponentGateway } from "../../../../../../src/application/context/components/remove/LocalRemoveComponentGateway.js";
import { RemoveComponentCommandHandler } from "../../../../../../src/application/context/components/remove/RemoveComponentCommandHandler.js";
import { IComponentRemoveReader } from "../../../../../../src/application/context/components/remove/IComponentRemoveReader.js";

describe("LocalRemoveComponentGateway", () => {
  let gateway: LocalRemoveComponentGateway;
  let mockCommandHandler: jest.Mocked<RemoveComponentCommandHandler>;
  let mockReader: jest.Mocked<IComponentRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveComponentCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IComponentRemoveReader>;

    gateway = new LocalRemoveComponentGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return response with view data", async () => {
    const componentId = "component-123";

    mockCommandHandler.execute.mockResolvedValue({ componentId, name: "OldService" });
    mockReader.findById.mockResolvedValue({
      componentId,
      name: "OldService",
      type: "service",
      description: "Legacy service",
      responsibility: "Legacy operations",
      path: "src/old-service.ts",
      status: "removed",
      deprecationReason: "No longer needed",
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-04T00:00:00Z",
    });

    const response = await gateway.removeComponent({ componentId });

    expect(response.componentId).toBe(componentId);
    expect(response.name).toBe("OldService");
    expect(response.status).toBe("removed");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ componentId });
    expect(mockReader.findById).toHaveBeenCalledWith(componentId);
  });

  it("should return defaults when view is not found", async () => {
    const componentId = "component-456";

    mockCommandHandler.execute.mockResolvedValue({ componentId, name: "GoneService" });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.removeComponent({ componentId });

    expect(response.componentId).toBe(componentId);
    expect(response.name).toBe("GoneService");
    expect(response.status).toBe("removed");
  });
});
