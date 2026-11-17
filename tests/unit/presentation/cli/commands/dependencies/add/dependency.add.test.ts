import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { dependencyAdd } from "../../../../../../../src/presentation/cli/commands/dependencies/add/dependency.add.js";
import { AddDependencyController } from "../../../../../../../src/application/context/dependencies/add/AddDependencyController.js";
import { AddRelationController } from "../../../../../../../src/application/context/relations/add/AddRelationController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { DependencyAddDependencies } from "../../../../../../../src/presentation/cli/commands/dependencies/add/dependency.add.js";

describe("dependency.add command", () => {
  let mockContainer: Partial<DependencyAddDependencies>;
  let mockDependencyController: jest.Mocked<Pick<AddDependencyController, "handle">>;
  let mockRelationController: jest.Mocked<Pick<AddRelationController, "handle">>;
  let stdoutSpy: jest.SpiedFunction<typeof console.log>;
  let stderrSpy: jest.SpiedFunction<typeof process.stderr.write>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockDependencyController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<AddDependencyController, "handle">>;
    mockRelationController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<AddRelationController, "handle">>;

    mockContainer = {
      addDependencyController: mockDependencyController as unknown as AddDependencyController,
      addRelationController: mockRelationController as unknown as AddRelationController,
    };

    stdoutSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    Renderer.reset();
  });

  it("creates an external dependency by default", async () => {
    mockDependencyController.handle.mockResolvedValue({ dependencyId: "dep_npm_express" });

    await dependencyAdd(
      {
        name: "Express",
        ecosystem: "npm",
        packageName: "express",
        versionConstraint: "^4.18.0",
      },
      mockContainer as DependencyAddDependencies
    );

    expect(mockDependencyController.handle).toHaveBeenCalledWith({
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: undefined,
      contract: undefined,
    });
    expect(mockRelationController.handle).not.toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("maps legacy flags to a component depends_on relation and warns on stderr", async () => {
    mockRelationController.handle.mockResolvedValue({ relationId: "relation_123" });

    await dependencyAdd(
      {
        consumerId: "UserController",
        providerId: "AuthMiddleware",
      },
      mockContainer as DependencyAddDependencies
    );

    expect(mockRelationController.handle).toHaveBeenCalledWith({
      fromEntityType: "component",
      fromEntityId: "UserController",
      toEntityType: "component",
      toEntityId: "AuthMiddleware",
      relationType: "depends_on",
      description: "Legacy dependency compatibility mapping: UserController depends on AuthMiddleware.",
    });
    expect(mockDependencyController.handle).not.toHaveBeenCalled();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[DEPRECATION]"));
  });

  it("keeps structured output clean while writing warnings to stderr", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    mockRelationController.handle.mockResolvedValue({ relationId: "relation_abc" });

    await dependencyAdd(
      {
        consumerId: "ApiGateway",
        providerId: "AuthService",
      },
      mockContainer as DependencyAddDependencies
    );

    const stdoutPayload = stdoutSpy.mock.calls[0]?.[0] as string;
    expect(() => JSON.parse(stdoutPayload)).not.toThrow();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[DEPRECATION]"));
  });
});
