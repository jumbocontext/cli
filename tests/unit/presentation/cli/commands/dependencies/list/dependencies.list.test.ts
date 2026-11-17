/**
 * Tests for dependencies.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { dependenciesList } from "../../../../../../../src/presentation/cli/commands/dependencies/list/dependencies.list.js";
import { GetDependenciesController } from "../../../../../../../src/application/context/dependencies/get/GetDependenciesController.js";
import { DependencyView } from "../../../../../../../src/application/context/dependencies/DependencyView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { DependenciesListDependencies } from "../../../../../../../src/presentation/cli/commands/dependencies/list/dependencies.list.js";

describe("dependencies.list command", () => {
  let mockContainer: Partial<DependenciesListDependencies>;
  let mockController: jest.Mocked<Pick<GetDependenciesController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    } as jest.Mocked<Pick<GetDependenciesController, "handle">>;

    mockContainer = {
      getDependenciesController: mockController as unknown as GetDependenciesController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all dependencies by default", async () => {
    const mockDependencies: DependencyView[] = [
      {
        dependencyId: "dep_123",
        name: "Express",
        ecosystem: "npm",
        packageName: "express",
        versionConstraint: "^4.18.0",
        endpoint: "/api",
        contract: "REST",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
        removedAt: null,
        removalReason: null,
      },
    ];

    mockController.handle.mockResolvedValue({ dependencies: mockDependencies });

    await dependenciesList({}, mockContainer as DependenciesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({
      filter: {
        name: undefined,
        ecosystem: undefined,
        packageName: undefined,
        consumer: undefined,
        provider: undefined,
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by ecosystem when specified", async () => {
    mockController.handle.mockResolvedValue({ dependencies: [] });

    await dependenciesList({ ecosystem: "npm" }, mockContainer as DependenciesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({
      filter: {
        name: undefined,
        ecosystem: "npm",
        packageName: undefined,
        consumer: undefined,
        provider: undefined,
      },
    });
  });

  it("should show info message when no dependencies exist", async () => {
    mockController.handle.mockResolvedValue({ dependencies: [] });

    await dependenciesList({}, mockContainer as DependenciesListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
