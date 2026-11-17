import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRemoveDependencyGateway } from "../../../../../../src/application/context/dependencies/remove/LocalRemoveDependencyGateway.js";
import { RemoveDependencyCommandHandler } from "../../../../../../src/application/context/dependencies/remove/RemoveDependencyCommandHandler.js";
import { IDependencyRemoveReader } from "../../../../../../src/application/context/dependencies/remove/IDependencyRemoveReader.js";
import { DependencyStatus } from "../../../../../../src/domain/dependencies/Constants.js";

describe("LocalRemoveDependencyGateway", () => {
  let gateway: LocalRemoveDependencyGateway;
  let mockCommandHandler: jest.Mocked<RemoveDependencyCommandHandler>;
  let mockReader: jest.Mocked<IDependencyRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveDependencyCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IDependencyRemoveReader>;

    gateway = new LocalRemoveDependencyGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return response with view data", async () => {
    const dependencyId = "dep_123";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });
    mockReader.findById.mockResolvedValue({
      dependencyId,
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api/users",
      contract: "IUserRepository",
      status: DependencyStatus.REMOVED,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
      removedAt: "2025-01-02T00:00:00Z",
      removalReason: "Migrated to MongoDB",
    });

    const response = await gateway.removeDependency({
      dependencyId,
      reason: "Migrated to MongoDB",
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(response.name).toBe("Express");
    expect(response.ecosystem).toBe("npm");
    expect(response.packageName).toBe("express");
    expect(response.status).toBe(DependencyStatus.REMOVED);
    expect(response.reason).toBe("Migrated to MongoDB");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      dependencyId,
      reason: "Migrated to MongoDB",
    });
    expect(mockReader.findById).toHaveBeenCalledWith(dependencyId);
  });

  it("should return defaults when view is not found", async () => {
    const dependencyId = "dep_456";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.removeDependency({ dependencyId });

    expect(response.dependencyId).toBe(dependencyId);
    expect(response.name).toBe("unknown");
    expect(response.ecosystem).toBe("unknown");
    expect(response.packageName).toBe("unknown");
    expect(response.status).toBe("removed");
  });
});
