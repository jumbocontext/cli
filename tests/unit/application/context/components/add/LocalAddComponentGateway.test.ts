import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddComponentGateway } from "../../../../../../src/application/context/components/add/LocalAddComponentGateway.js";
import { AddComponentCommandHandler } from "../../../../../../src/application/context/components/add/AddComponentCommandHandler.js";
import { IComponentUpdateReader } from "../../../../../../src/application/context/components/update/IComponentUpdateReader.js";

describe("LocalAddComponentGateway", () => {
  let gateway: LocalAddComponentGateway;
  let mockCommandHandler: jest.Mocked<AddComponentCommandHandler>;
  let mockComponentReader: jest.Mocked<IComponentUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddComponentCommandHandler>;

    mockComponentReader = {
      findById: jest.fn(),
    } as jest.Mocked<IComponentUpdateReader>;

    gateway = new LocalAddComponentGateway(mockCommandHandler, mockComponentReader);
  });

  it("should execute command and return response for new component", async () => {
    const componentId = "component-123";

    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockComponentReader.findById.mockResolvedValue({
      componentId,
      name: "UserController",
      type: "service",
      description: "Handles user-related HTTP requests",
      responsibility: "User authentication and profile management",
      path: "src/api/user-controller.ts",
      status: "active",
      deprecationReason: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    const response = await gateway.addComponent({
      name: "UserController",
      type: "service",
      description: "Handles user-related HTTP requests",
      responsibility: "User authentication and profile management",
      path: "src/api/user-controller.ts",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.name).toBe("UserController");
    expect(response.type).toBe("service");
    expect(response.path).toBe("src/api/user-controller.ts");
    expect(response.status).toBe("active");
    expect(response.isUpdate).toBe(false);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      name: "UserController",
      type: "service",
      description: "Handles user-related HTTP requests",
      responsibility: "User authentication and profile management",
      path: "src/api/user-controller.ts",
    });
    expect(mockComponentReader.findById).toHaveBeenCalledWith(componentId);
  });

  it("should return isUpdate true when component already existed", async () => {
    const componentId = "component-456";

    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockComponentReader.findById.mockResolvedValue({
      componentId,
      name: "PostgresDB",
      type: "db",
      description: "Primary database",
      responsibility: "Data persistence",
      path: "docker-compose.yml",
      status: "active",
      deprecationReason: null,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });

    const response = await gateway.addComponent({
      name: "PostgresDB",
      type: "db",
      description: "Primary database",
      responsibility: "Data persistence",
      path: "docker-compose.yml",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.isUpdate).toBe(true);
  });

  it("should return defaults when view is not found", async () => {
    const componentId = "component-789";

    mockCommandHandler.execute.mockResolvedValue({ componentId });
    mockComponentReader.findById.mockResolvedValue(null);

    const response = await gateway.addComponent({
      name: "CacheService",
      type: "cache",
      description: "In-memory cache",
      responsibility: "Caching",
      path: "src/cache.ts",
    });

    expect(response.componentId).toBe(componentId);
    expect(response.type).toBe("cache");
    expect(response.path).toBe("src/cache.ts");
    expect(response.status).toBe("active");
    expect(response.isUpdate).toBe(false);
  });
});
