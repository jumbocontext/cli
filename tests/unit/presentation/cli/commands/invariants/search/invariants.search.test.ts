import { afterEach, beforeEach, describe, expect, jest } from "@jest/globals";
import { Command } from "commander";
import { SearchInvariantsController } from "../../../../../../../src/application/context/invariants/search/SearchInvariantsController.js";
import { InvariantView } from "../../../../../../../src/application/context/invariants/InvariantView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import { invariantsSearch } from "../../../../../../../src/presentation/cli/commands/invariants/search/invariants.search.js";

describe("invariants search command", () => {
  let mockController: jest.Mocked<SearchInvariantsController>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  const mockInvariants: InvariantView[] = [
    {
      invariantId: "inv_1",
      title: "Clean Architecture",
      description: "Keep layer boundaries clear",
      rationale: "Reduces coupling",
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    } as InvariantView,
  ];

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    mockController = {
      handle: jest.fn<SearchInvariantsController["handle"]>().mockResolvedValue({ invariants: mockInvariants }),
    } as unknown as jest.Mocked<SearchInvariantsController>;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();
    jest.restoreAllMocks();
  });

  it("searches by title filter", async () => {
    await invariantsSearch(
      { title: "Clean*" },
      { searchInvariantsController: mockController },
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: { title: "Clean*" },
    });
  });

  it("searches by query filter", async () => {
    await invariantsSearch(
      { query: "stdout" },
      { searchInvariantsController: mockController },
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: { query: "stdout" },
    });
  });

  it("renders human-readable output in text format", async () => {
    await invariantsSearch(
      { title: "Clean*" },
      { searchInvariantsController: mockController },
    );

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("renders structured output in JSON format", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await invariantsSearch(
      { title: "Clean*" },
      { searchInvariantsController: mockController },
    );

    const output = String(consoleLogSpy.mock.calls.at(-1)?.[0] ?? "");
    const parsed = JSON.parse(output) as { invariants: InvariantView[] };
    expect(parsed.invariants).toHaveLength(1);
    expect(parsed.invariants[0]?.title).toBe("Clean Architecture");
  });
});
