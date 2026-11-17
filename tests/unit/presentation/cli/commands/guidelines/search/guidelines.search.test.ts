import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { Command } from "commander";
import { SearchGuidelinesController } from "../../../../../../../src/application/context/guidelines/search/SearchGuidelinesController.js";
import { GuidelineView } from "../../../../../../../src/application/context/guidelines/GuidelineView.js";
import {
  guidelinesSearch,
  registerGuidelinesSearchCommand,
} from "../../../../../../../src/presentation/cli/commands/guidelines/search/guidelines.search.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { GuidelinesSearchDependencies } from "../../../../../../../src/presentation/cli/commands/guidelines/search/guidelines.search.js";

describe("guidelines.search command", () => {
  let mockController: jest.Mocked<SearchGuidelinesController>;
  let mockContainer: Partial<GuidelinesSearchDependencies>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  const mockGuidelines: GuidelineView[] = [
    {
      guidelineId: "guide_1",
      category: "testing",
      title: "Test behavior",
      description: "Cover important behavior",
      rationale: "Prevents regressions",
      examples: ["tests/example.test.ts"],
      isRemoved: false,
      removedAt: null,
      removalReason: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn<SearchGuidelinesController["handle"]>().mockResolvedValue({ guidelines: mockGuidelines }),
    } as unknown as jest.Mocked<SearchGuidelinesController>;

    mockContainer = {
      searchGuidelinesController: mockController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should declare search options, examples, and related commands", () => {
    const guidelines = new Command("guidelines");
    registerGuidelinesSearchCommand(guidelines);
    const command = guidelines.commands.find((c) => c.name() === "search");
    expect(command).toBeDefined();

    expect(command!.options.map(option => option.flags)).toEqual([
      "-c, --category <category>",
      "-t, --title <title>",
      "-q, --query <query>",
      "-o, --output <output>",
    ]);

    const help = command!.helpInformation();
    expect(help).toContain("Search guidelines by category, title, or free-text query");
    expect(help).toContain("jumbo guidelines search --category testing");
    expect(help).toContain("jumbo guidelines search --query \"stdout\" --output compact");
    expect(help).toContain("Related: jumbo guidelines list");
  });

  it("should search guidelines with category, title, and query filters", async () => {
    await guidelinesSearch(
      { category: "testing", title: "Test*", query: "regressions", output: "compact" },
      mockContainer as GuidelinesSearchDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith({
      criteria: {
        category: "testing",
        title: "Test*",
        query: "regressions",
      },
    });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await guidelinesSearch(
      { title: "Test" },
      mockContainer as GuidelinesSearchDependencies
    );

    expect(mockController.handle).toHaveBeenCalledWith({ criteria: { title: "Test" } });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
