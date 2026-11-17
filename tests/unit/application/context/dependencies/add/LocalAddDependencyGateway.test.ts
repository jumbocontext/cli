import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddDependencyGateway } from "../../../../../../src/application/context/dependencies/add/LocalAddDependencyGateway.js";
import { AddDependencyCommandHandler } from "../../../../../../src/application/context/dependencies/add/AddDependencyCommandHandler.js";

describe("LocalAddDependencyGateway", () => {
  let gateway: LocalAddDependencyGateway;
  let mockCommandHandler: jest.Mocked<AddDependencyCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddDependencyCommandHandler>;

    gateway = new LocalAddDependencyGateway(mockCommandHandler);
  });

  it("should execute command and return dependency id", async () => {
    const dependencyId = "dep_npm_express";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });

    const response = await gateway.addDependency({
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api/users",
      contract: "IUserRepository",
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: "/api/users",
      contract: "IUserRepository",
    });
  });

  it("should handle request with only required fields", async () => {
    const dependencyId = "dep_pip_fastapi";

    mockCommandHandler.execute.mockResolvedValue({ dependencyId });

    const response = await gateway.addDependency({
      name: "FastAPI",
      ecosystem: "pip",
      packageName: "fastapi",
    });

    expect(response.dependencyId).toBe(dependencyId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      name: "FastAPI",
      ecosystem: "pip",
      packageName: "fastapi",
      versionConstraint: undefined,
      endpoint: undefined,
      contract: undefined,
    });
  });
});
