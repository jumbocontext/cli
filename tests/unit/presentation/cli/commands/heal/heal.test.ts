import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { heal } from "../../../../../../src/presentation/cli/commands/heal/heal.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";
import { RebuildDatabaseController } from "../../../../../../src/application/maintenance/db/rebuild/RebuildDatabaseController.js";
import type { HealDependencies } from "../../../../../../src/presentation/cli/commands/heal/heal.js";

describe("heal command", () => {
  let mockContainer: Partial<HealDependencies>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    mockContainer = {
      rebuildDatabaseController: {
        handle: jest.fn().mockResolvedValue({
          success: true,
          eventsReplayed: 123,
        }),
      } as unknown as RebuildDatabaseController,
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      },
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
    Renderer.reset();
  });

  it("requires --yes before running the rebuild", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await expect(heal({}, mockContainer as HealDependencies)).rejects.toThrow(
      "process.exit called with code 1"
    );

    expect(mockContainer.rebuildDatabaseController?.handle).not.toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Use --yes flag to proceed");
  });

  it("delegates to RebuildDatabaseController and renders text output", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await heal({ yes: true }, mockContainer as HealDependencies);

    expect(mockContainer.rebuildDatabaseController?.handle).toHaveBeenCalledWith({
      skipConfirmation: true,
    });

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Projection Rebuild");
    expect(output).toContain("Rebuild complete");
    expect(output).toContain("Events replayed");
    expect(output).toContain("123");
  });

  it("renders structured output in json mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await heal({ yes: true }, mockContainer as HealDependencies);

    const parsed = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
    expect(parsed.success).toBe(true);
    expect(parsed.eventsReplayed).toBe(123);
  });

  it("renders failure output and exits with code 1", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    (mockContainer.rebuildDatabaseController!.handle as jest.Mock).mockRejectedValue(
      new Error("rebuild failed")
    );

    await expect(heal({ yes: true }, mockContainer as HealDependencies)).rejects.toThrow(
      "process.exit called with code 1"
    );

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Projection rebuild failed");
    expect(output).toContain("rebuild failed");
  });
});
