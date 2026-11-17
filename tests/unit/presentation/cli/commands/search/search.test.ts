import { afterEach, beforeEach, describe, expect, jest } from "@jest/globals";
import { Command } from "commander";
import { SearchController } from "../../../../../../src/application/context/search/SearchController.js";
import { SearchCategory } from "../../../../../../src/application/context/search/SearchCategory.js";
import { SearchResponse } from "../../../../../../src/application/context/search/SearchResponse.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";
import {
  registerSearchCommand,
  searchMemory,
} from "../../../../../../src/presentation/cli/commands/search/search.js";

describe("search command registration", () => {
  const buildCommand = (): Command => {
    const program = new Command();
    registerSearchCommand(program);
    return program.commands[0]!;
  };

  it("registers a top-level `jumbo search` leaf", () => {
    const command = buildCommand();

    expect(command.name()).toBe("search");
  });

  it("declares query as the only required option", () => {
    const command = buildCommand();

    const requiredFlags = command.options
      .filter((option) => option.mandatory)
      .map((option) => option.flags);

    expect(requiredFlags).toEqual(["-q, --query <query>"]);
  });

  it("declares category, limit, and output options", () => {
    const command = buildCommand();

    const flags = command.options.map((option) => option.flags);

    expect(flags).toEqual(
      expect.arrayContaining([
        "-c, --category <category>",
        "-l, --limit <limit>",
        "-o, --output <output>",
      ]),
    );
  });
});

describe("search command execution", () => {
  let mockController: jest.Mocked<SearchController>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  const response: SearchResponse = {
    hits: [
      {
        source: { type: SearchCategory.COMPONENT, id: "comp_1" },
        category: SearchCategory.COMPONENT,
        title: "SearchOutputBuilder",
        summary: "Renders search hits",
        snippet: null,
        facets: { status: "active" },
        score: 25,
      },
    ],
    groups: [
      {
        category: SearchCategory.COMPONENT,
        hits: [
          {
            source: { type: SearchCategory.COMPONENT, id: "comp_1" },
            category: SearchCategory.COMPONENT,
            title: "SearchOutputBuilder",
            summary: "Renders search hits",
            snippet: null,
            facets: { status: "active" },
            score: 25,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    mockController = {
      handle: jest.fn<SearchController["handle"]>().mockResolvedValue(response),
    } as unknown as jest.Mocked<SearchController>;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    Renderer.reset();
    jest.restoreAllMocks();
  });

  it("builds a typed global search request and renders text output", async () => {
    await searchMemory(
      {
        query: " search ",
        category: SearchCategory.COMPONENT,
        limit: "5",
        output: "compact",
      },
      { searchController: mockController },
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: {
        query: "search",
        groupByCategory: true,
        category: SearchCategory.COMPONENT,
        limit: 5,
      },
    });
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("outputs one JSON object when configured for structured output", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await searchMemory({ query: "search" }, { searchController: mockController });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as {
      query: string;
      count: number;
      groups: Array<{ category: string }>;
    };
    expect(parsed.query).toBe("search");
    expect(parsed.count).toBe(1);
    expect(parsed.groups[0].category).toBe(SearchCategory.COMPONENT);
  });

  it("rejects invalid options through renderer error conventions", async () => {
    const processExitSpy = jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);

    await expect(
      searchMemory(
        { query: "search", category: "unknown" },
        { searchController: mockController },
      ),
    ).rejects.toThrow("process.exit called with code 1");

    expect(mockController.handle).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("reports application errors without writing structured output to stdout", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });
    mockController.handle.mockRejectedValue(new Error("search index unavailable"));
    jest.spyOn(process, "exit").mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit);

    await expect(
      searchMemory({ query: "search" }, { searchController: mockController }),
    ).rejects.toThrow("process.exit called with code 1");

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const parsedError = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string) as { error: string; details: string };
    expect(parsedError.error).toBe("Failed to search Jumbo memory");
    expect(parsedError.details).toBe("search index unavailable");
  });
});
