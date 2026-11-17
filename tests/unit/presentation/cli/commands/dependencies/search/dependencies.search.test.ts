import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DependencyView } from "../../../../../../../src/application/context/dependencies/DependencyView.js";
import { IDependencyViewReader } from "../../../../../../../src/application/context/dependencies/get/IDependencyViewReader.js";
import { SearchDependenciesController } from "../../../../../../../src/application/context/dependencies/search/SearchDependenciesController.js";
import { SearchDependenciesController } from "../../../../../../../src/application/context/dependencies/search/SearchDependenciesController.js";
import { Command } from "commander";
import { registerDependenciesSearchCommand } from "../../../../../../../src/presentation/cli/commands/dependencies/search/dependencies.search.js";
import { dependenciesSearch } from "../../../../../../../src/presentation/cli/commands/dependencies/search/dependencies.search.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { DependenciesSearchDependencies } from "../../../../../../../src/presentation/cli/commands/dependencies/search/dependencies.search.js";

describe("dependencies.search command", () => {
  let mockReader: jest.Mocked<IDependencyViewReader>;
  let mockSearchController: { handle: jest.Mock };
  let mockContainer: Partial<DependenciesSearchDependencies>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockDependencies: DependencyView[] = [
    {
      dependencyId: "dep_1",
      name: "Express",
      ecosystem: "npm",
      packageName: "express",
      versionConstraint: "^4.18.0",
      endpoint: null,
      contract: "HTTP server",
      status: "active",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      removedAt: null,
      removalReason: null,
    },
  ];

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IDependencyViewReader["search"]>().mockResolvedValue(mockDependencies),
    };

    mockSearchController = {
      handle: jest.fn<(request: unknown) => Promise<unknown>>().mockImplementation(async (request: { criteria: Record<string, unknown> }) => {
        await mockReader.search(request.criteria as Parameters<IDependencyViewReader["search"]>[0]);
        return { dependencies: mockDependencies };
      }),
    };

    mockContainer = {
      searchDependenciesController:
        mockSearchController as unknown as SearchDependenciesController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
    Renderer.reset();
  });

  it("should declare the registered command grammar", () => {
    const dependencies = new Command("dependencies");
    registerDependenciesSearchCommand(dependencies);
    const command = dependencies.commands[0];

    expect(command.description()).toContain("Search dependencies");
    expect(command.options.map(option => option.flags)).toEqual([
      "--name <name>",
      "--ecosystem <ecosystem>",
      "--package-name <packageName>",
      "--version <version>",
      "--status <status>",
      "--consumer <componentId>",
      "--provider <componentId>",
      "-q, --query <query>",
      "-o, --output <output>",
    ]);
  });

  it("should search dependencies with all supported filters", async () => {
    await dependenciesSearch(
      {
        name: "Express",
        ecosystem: "npm",
        packageName: "exp*",
        version: "^4",
        status: "active",
        consumer: "Auth*",
        provider: "*Client",
        query: "server",
        output: "compact",
      },
      mockContainer as DependenciesSearchDependencies
    );

    expect(mockSearchController.handle).toHaveBeenCalledWith({
      criteria: {
        name: "Express",
        ecosystem: "npm",
        packageName: "exp*",
        versionConstraint: "^4",
        status: "active",
        consumer: "Auth*",
        provider: "*Client",
        query: "server",
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await dependenciesSearch(
      { packageName: "express" },
      mockContainer as DependenciesSearchDependencies
    );

    expect(mockSearchController.handle).toHaveBeenCalledWith({
      criteria: {
        packageName: "express",
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should reject invalid status values", async () => {
    await expect(
      dependenciesSearch({ status: "unknown" }, mockContainer as DependenciesSearchDependencies)
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockReader.search).not.toHaveBeenCalled();
  });

  it("should reject invalid output modes", async () => {
    await expect(
      dependenciesSearch({ output: "wide" }, mockContainer as DependenciesSearchDependencies)
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockReader.search).not.toHaveBeenCalled();
  });
});
