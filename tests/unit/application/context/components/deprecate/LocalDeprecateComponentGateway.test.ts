import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalDeprecateComponentGateway } from "../../../../../../src/application/context/components/deprecate/LocalDeprecateComponentGateway.js";
import { DeprecateComponentCommandHandler } from "../../../../../../src/application/context/components/deprecate/DeprecateComponentCommandHandler.js";
import { IComponentDeprecateReader } from "../../../../../../src/application/context/components/deprecate/IComponentDeprecateReader.js";

describe("LocalDeprecateComponentGateway", () => {
  let gateway: LocalDeprecateComponentGateway;
  let mockCommandHandler: jest.Mocked<DeprecateComponentCommandHandler>;
  let mockReader: jest.Mocked<IComponentDeprecateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeprecateComponentCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IComponentDeprecateReader>;

    gateway = new LocalDeprecateComponentGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return response with view data", async () => {
    const componentId = "component-123";

    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue({
      componentId,
      name: "AuthMiddleware",
      type: "service",
      description: "Handles authentication",
      responsibility: "Auth",
      path: "src/auth.ts",
      status: "deprecated",
      deprecationReason: "Replaced by NewAuthMiddleware",
      version: 3,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-03T00:00:00Z",
    });

    const response = await gateway.deprecateComponent({
      componentId,
      reason: "Replaced by NewAuthMiddleware",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.name).toBe("AuthMiddleware");
    expect(response.status).toBe("deprecated");
    expect(response.reason).toBe("Replaced by NewAuthMiddleware");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      componentId,
      reason: "Replaced by NewAuthMiddleware",
    });
    expect(mockReader.findById).toHaveBeenCalledWith(componentId);
  });

  it("should return defaults when view is not found", async () => {
    const componentId = "component-456";

    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.deprecateComponent({
      componentId,
    });

    expect(response.componentId).toBe(componentId);
    expect(response.name).toBe("Unknown");
    expect(response.status).toBe("deprecated");
  });
});
