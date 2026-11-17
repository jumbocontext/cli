import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { architectureDefine } from "../../../../../../../src/presentation/cli/commands/architecture/define/architecture.define.js";
import { DefineArchitectureController } from "../../../../../../../src/application/context/architecture/define/DefineArchitectureController.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { ArchitectureErrorMessages } from "../../../../../../../src/domain/architecture/Constants.js";
import { ARCHITECTURE_DEPRECATION_NOTICE } from "../../../../../../../src/application/context/architecture/ArchitectureDeprecationConstants.js";
import type { ArchitectureDefineDependencies } from "../../../../../../../src/presentation/cli/commands/architecture/define/architecture.define.js";

describe("architecture.define command", () => {
  let mockDefineController: { handle: jest.Mock };
  let mockContainer: Partial<ArchitectureDefineDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockDefineController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        architectureId: "architecture",
      }),
    };

    mockContainer = {
      defineArchitectureController:
        mockDefineController as unknown as DefineArchitectureController,
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
    await architectureDefine(
      {
        description: "Event-sourced DDD system",
        organization: "Clean Architecture",
        pattern: ["DDD", "CQRS"],
        stack: ["TypeScript"],
      },
      mockContainer as ArchitectureDefineDependencies
    );

    expect(mockDefineController.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Event-sourced DDD system",
        organization: "Clean Architecture",
        patterns: ["DDD", "CQRS"],
        stack: ["TypeScript"],
      })
    );
  });

  it("should reject with migration guidance when architecture is deprecated", async () => {
    mockDefineController.handle.mockRejectedValue(
      new Error(ArchitectureErrorMessages.DEPRECATED)
    );

    await expect(
      architectureDefine(
        {
          description: "New system",
          organization: "Layered",
        },
        mockContainer as ArchitectureDefineDependencies
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain(ARCHITECTURE_DEPRECATION_NOTICE);
    expect(errorOutput).toContain("jumbo decision add");
    expect(errorOutput).toContain("jumbo component add");
  });

  it("should exit with error for non-deprecation failures", async () => {
    mockDefineController.handle.mockRejectedValue(
      new Error(ArchitectureErrorMessages.ALREADY_DEFINED)
    );

    await expect(
      architectureDefine(
        {
          description: "New system",
          organization: "Layered",
        },
        mockContainer as ArchitectureDefineDependencies
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Failed to define architecture");
  });
});
