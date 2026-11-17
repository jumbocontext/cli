import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateDependencyGateway } from "../../../../../../src/application/context/dependencies/update/LocalUpdateDependencyGateway.js";
import { UpdateDependencyCommandHandler } from "../../../../../../src/application/context/dependencies/update/UpdateDependencyCommandHandler.js";
import { IDependencyUpdateReader } from "../../../../../../src/application/context/dependencies/update/IDependencyUpdateReader.js";
import { DependencyStatus } from "../../../../../../src/domain/dependencies/Constants.js";
import { DependencyView } from "../../../../../../src/application/context/dependencies/DependencyView.js";

describe("LocalUpdateDependencyGateway", () => {
  let gateway: LocalUpdateDependencyGateway;
  let mockCommandHandler: jest.Mocked<UpdateDependencyCommandHandler>;
  let mockDependencyReader: jest.Mocked<IDependencyUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateDependencyCommandHandler>;

    mockDependencyReader = {
      findById: jest.fn(),
    } as jest.Mocked<IDependencyUpdateReader>;

    gateway = new LocalUpdateDependencyGateway(mockCommandHandler, mockDependencyReader);
  });

  it("should execute command and return enriched response with view data", async () => {
    const dependencyId = "dep_123";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });

    const view: DependencyView = {
      dependencyId,
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api/v2/users",
      contract: "IUserRepository",
      status: DependencyStatus.ACTIVE,
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      removedAt: null,
      removalReason: null,
    };
    mockDependencyReader.findById.mockResolvedValue(view);

    const response = await gateway.updateDependency({
      dependencyId: "dep_123",
      endpoint: "/api/v2/users",
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(response.name).toBe("Express");
    expect(response.ecosystem).toBe("npm");
    expect(response.packageName).toBe("express");
    expect(response.versionConstraint).toBe("^4.18.0");
    expect(response.endpoint).toBe("/api/v2/users");
    expect(response.contract).toBe("IUserRepository");
    expect(response.status).toBe(DependencyStatus.ACTIVE);

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      id: "dep_123",
      endpoint: "/api/v2/users",
      contract: undefined,
      status: undefined,
    });
    expect(mockDependencyReader.findById).toHaveBeenCalledWith(dependencyId);
  });

  it("should return minimal response when view is not found", async () => {
    const dependencyId = "dep_456";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });
    mockDependencyReader.findById.mockResolvedValue(null);

    const response = await gateway.updateDependency({
      dependencyId: "dep_456",
      status: DependencyStatus.DEPRECATED,
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(response.name).toBeUndefined();
    expect(response.ecosystem).toBeUndefined();
    expect(response.packageName).toBeUndefined();
  });

  it("should pass all fields to command handler", async () => {
    const dependencyId = "dep_789";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });
    mockDependencyReader.findById.mockResolvedValue(null);

    await gateway.updateDependency({
      dependencyId: "dep_789",
      endpoint: "/api/v2/items",
      contract: "gRPC service",
      status: DependencyStatus.DEPRECATED,
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      id: "dep_789",
      endpoint: "/api/v2/items",
      contract: "gRPC service",
      status: DependencyStatus.DEPRECATED,
    });
  });
});
