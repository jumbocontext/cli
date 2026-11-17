/**
 * Tests for evolve CLI command — confirmation gate, success, and failure paths
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { evolve } from "../../../../../../src/presentation/cli/commands/evolve/evolve.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("evolve command", () => {
  let mockEvolveController: { handle: jest.Mock };
  let mockLogger: { info: jest.Mock; error: jest.Mock };
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockEvolveController = {
      handle: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        steps: [{ name: "Schema migrations", status: "succeeded" }],
      }),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
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

  it("should exit with confirmation required when --yes is absent", async () => {
    await expect(
      evolve({}, {
        evolveController: mockEvolveController as never,
        logger: mockLogger as never,
      })
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockEvolveController.handle).not.toHaveBeenCalled();
  });

  it("should run evolve when --yes is passed", async () => {
    await evolve(
      { yes: true },
      {
        evolveController: mockEvolveController as never,
        logger: mockLogger as never,
      }
    );

    expect(mockEvolveController.handle).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("[evolve] Evolve command completed"),
      expect.objectContaining({ steps: expect.any(Array) })
    );
  });

  it("should render failure and exit 1 when evolve fails", async () => {
    mockEvolveController.handle.mockRejectedValue(new Error("boom"));

    await expect(
      evolve(
        { yes: true },
        {
          evolveController: mockEvolveController as never,
          logger: mockLogger as never,
        }
      )
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("[evolve] Evolve command failed"),
      expect.any(Error),
      expect.objectContaining({})
    );
  });
});
