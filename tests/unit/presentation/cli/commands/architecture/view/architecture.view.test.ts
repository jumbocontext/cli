import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { architectureView } from "../../../../../../../src/presentation/cli/commands/architecture/view/architecture.view.js";
import { GetArchitectureController } from "../../../../../../../src/application/context/architecture/get/GetArchitectureController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { ArchitectureViewDependencies } from "../../../../../../../src/presentation/cli/commands/architecture/view/architecture.view.js";
import {
  ARCHITECTURE_DEPRECATION_NOTICE,
} from "../../../../../../../src/application/context/architecture/ArchitectureDeprecationConstants.js";

describe("architecture.view command", () => {
  let mockGetController: { handle: jest.Mock };
  let mockContainer: Partial<ArchitectureViewDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockArchitecture = {
    architectureId: "architecture",
    description: "Event-sourced DDD system",
    organization: "Clean Architecture",
    patterns: ["DDD", "CQRS"],
    principles: ["Single Responsibility"],
    dataStores: [{ name: "sqlite", type: "relational", purpose: "projections" }],
    stack: ["TypeScript", "Node.js"],
    deprecated: true,
    version: 2,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  };

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockGetController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        architecture: mockArchitecture,
      }),
    };

    mockContainer = {
      getArchitectureController:
        mockGetController as unknown as GetArchitectureController,
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    Renderer.reset();
  });

  it("should display architecture with deprecation notice", async () => {
    await architectureView(mockContainer as ArchitectureViewDependencies);

    const output = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Architecture");
    expect(output).toContain("Event-sourced DDD system");
    expect(output).toContain(ARCHITECTURE_DEPRECATION_NOTICE);
    expect(output).toContain("jumbo decision add");
    expect(output).toContain("jumbo invariant add");
    expect(output).toContain("jumbo component add");
    expect(output).toContain("jumbo dependency add");
  });

  it("should display migration mapping table in deprecation notice", async () => {
    await architectureView(mockContainer as ArchitectureViewDependencies);

    const output = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("jumbo decision add");
    expect(output).toContain("jumbo invariant add");
    expect(output).toContain("jumbo component add");
    expect(output).toContain("jumbo dependency add");
  });

  it("should show info message when no architecture defined", async () => {
    mockGetController.handle.mockResolvedValue({ architecture: null });

    await architectureView(mockContainer as ArchitectureViewDependencies);

    const output = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("No architecture defined");
  });

  it("should display architecture fields", async () => {
    await architectureView(mockContainer as ArchitectureViewDependencies);

    const output = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("Clean Architecture");
    expect(output).toContain("DDD");
    expect(output).toContain("CQRS");
    expect(output).toContain("Single Responsibility");
    expect(output).toContain("TypeScript");
    expect(output).toContain("sqlite");
  });

  it("should exit with error on failure", async () => {
    mockGetController.handle.mockRejectedValue(new Error("Database error"));

    await expect(
      architectureView(mockContainer as ArchitectureViewDependencies)
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Failed to view architecture");
  });
});
