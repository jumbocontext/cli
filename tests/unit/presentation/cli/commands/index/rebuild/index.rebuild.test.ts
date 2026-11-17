import { afterEach, beforeEach, describe, expect, jest } from "@jest/globals";
import { Command } from "commander";
import { SearchIndexRebuildController } from "../../../../../../../src/application/context/search/SearchIndexRebuildController.js";
import { SearchIndexRebuildResponse } from "../../../../../../../src/application/context/search/SearchIndexRebuildResponse.js";
import { SearchCategory } from "../../../../../../../src/application/context/search/SearchCategory.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import {
  indexRebuild,
  registerIndexRebuildCommand,
} from "../../../../../../../src/presentation/cli/commands/index/rebuild/index.rebuild.js";

describe("index rebuild command registration", () => {
  const buildCommand = (): Command => {
    const program = new Command();
    registerIndexRebuildCommand(program);
    return program.commands[0]!;
  };

  it("registers the `jumbo index rebuild` leaf", () => {
    const command = buildCommand();

    expect(command.name()).toBe("rebuild");
    expect(command.description()).toContain("Rebuild");
  });
});

describe("index rebuild execution", () => {
  let mockController: jest.Mocked<SearchIndexRebuildController>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let dependencies: IndexRebuildDependencies;

  const response: SearchIndexRebuildResponse = {
    success: true,
    eventsInspected: 4,
    documentsIndexed: 2,
    removedEntries: 1,
    countsByCategory: { [SearchCategory.COMPONENT]: 2 },
  };

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    mockController = {
      handle: jest.fn().mockResolvedValue(response),
    } as unknown as jest.Mocked<SearchIndexRebuildController>;
    dependencies = { searchIndexRebuildController: mockController };
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders text output on success", async () => {
    await indexRebuild({}, dependencies);

    expect(mockController.handle).toHaveBeenCalledWith({});
    expect(consoleLogSpy.mock.calls[0]?.[0]).toContain("Search Index Rebuild");
  });

  it("reports rebuild failures to stderr in JSON mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    mockController.handle.mockRejectedValue(new Error("rebuild failed"));
    jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);

    await expect(indexRebuild({}, dependencies)).rejects.toThrow(
      "process.exit called with code 1",
    );

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const parsedError = JSON.parse(String(consoleErrorSpy.mock.calls[0][0])) as {
      error: string;
      details: string;
    };
    expect(parsedError.error).toBe("Search index rebuild failed");
    expect(parsedError.details).toBe("rebuild failed");
  });
});
