import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { architectureUpdate } from "../../../../../../../src/presentation/cli/commands/architecture/update/architecture.update.js";
import { UpdateArchitectureController } from "../../../../../../../src/application/context/architecture/update/UpdateArchitectureController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { ArchitectureErrorMessages } from "../../../../../../../src/domain/architecture/Constants.js";
import { ARCHITECTURE_DEPRECATION_NOTICE } from "../../../../../../../src/application/context/architecture/ArchitectureDeprecationConstants.js";
import type { ArchitectureUpdateDependencies } from "../../../../../../../src/presentation/cli/commands/architecture/update/architecture.update.js";

describe("architecture.update command", () => {
  let mockUpdateController: { handle: jest.Mock };
  let mockContainer: Partial<ArchitectureUpdateDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockUpdateController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        architectureId: "architecture",
      }),
    };

    mockContainer = {
      updateArchitectureController:
        mockUpdateController as unknown as UpdateArchitectureController,
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

  it("should delegate to controller when architecture is not deprecated", async () => {
    await architectureUpdate(
      {
        pattern: ["DDD", "CQRS", "EventSourcing"],
        principle: ["SOLID"],
      },
      mockContainer as ArchitectureUpdateDependencies
    );

    expect(mockUpdateController.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        patterns: ["DDD", "CQRS", "EventSourcing"],
        principles: ["SOLID"],
      })
    );
  });

  it("should reject with migration guidance when architecture is deprecated", async () => {
    mockUpdateController.handle.mockRejectedValue(
      new Error(ArchitectureErrorMessages.DEPRECATED)
    );

    await expect(
      architectureUpdate(
        { description: "Updated overview" },
        mockContainer as ArchitectureUpdateDependencies
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain(ARCHITECTURE_DEPRECATION_NOTICE);
    expect(errorOutput).toContain("jumbo decision add");
    expect(errorOutput).toContain("jumbo component add");
  });

  it("should exit with error for non-deprecation failures", async () => {
    mockUpdateController.handle.mockRejectedValue(
      new Error(ArchitectureErrorMessages.NOT_DEFINED)
    );

    await expect(
      architectureUpdate(
        { description: "Updated overview" },
        mockContainer as ArchitectureUpdateDependencies
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Failed to update architecture");
  });
});
