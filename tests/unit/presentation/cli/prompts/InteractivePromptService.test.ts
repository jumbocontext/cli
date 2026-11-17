/**
 * Tests for InteractivePromptService
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.unstable_mockModule("@inquirer/prompts", () => ({
  checkbox: jest.fn(),
  input: jest.fn(),
}));

const prompts = await import("@inquirer/prompts");
const checkboxMock = prompts.checkbox as jest.Mock;
const inputMock = prompts.input as jest.Mock;

const { InteractivePromptService } =
  await import("../../../../../src/presentation/cli/prompts/InteractivePromptService.js");
import type { EntitySelectionConfig } from "../../../../../src/presentation/cli/prompts/InteractivePromptService.js";

// Sample entity type for testing
interface TestEntity {
  id: string;
  name: string;
  description: string;
}

describe("InteractivePromptService", () => {
  let service: InteractivePromptService;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    service = new InteractivePromptService();
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("selectEntities", () => {
    const testEntities: TestEntity[] = [
      { id: "1", name: "Entity One", description: "First entity" },
      { id: "2", name: "Entity Two", description: "Second entity" },
      { id: "3", name: "Entity Three", description: "Third entity" },
    ];

    const defaultConfig: EntitySelectionConfig<TestEntity> = {
      message: "Select entities:",
      formatter: (e) => `${e.name} - ${e.description}`,
    };

    it("should return selected entities in original form", async () => {
      checkboxMock.mockResolvedValueOnce([0, 2]);

      const result = await service.selectEntities(testEntities, defaultConfig);

      expect(result.prompted).toBe(true);
      expect(result.selected).toHaveLength(2);
      expect(result.selected[0]).toBe(testEntities[0]);
      expect(result.selected[1]).toBe(testEntities[2]);
    });

    it("should return empty selection when user selects nothing", async () => {
      checkboxMock.mockResolvedValueOnce([]);

      const result = await service.selectEntities(testEntities, defaultConfig);

      expect(result.prompted).toBe(true);
      expect(result.selected).toHaveLength(0);
    });

    it("should handle empty entity list gracefully", async () => {
      const config: EntitySelectionConfig<TestEntity> = {
        ...defaultConfig,
        emptyMessage: "No entities available. Skipping.",
      };

      const result = await service.selectEntities([], config);

      expect(result.prompted).toBe(false);
      expect(result.selected).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("No entities available"),
      );
    });

    it("should only log spacing when empty list has no emptyMessage", async () => {
      const result = await service.selectEntities([], defaultConfig);

      expect(result.prompted).toBe(false);
      expect(result.selected).toHaveLength(0);
      // Only the spacing log should be called, not an empty message
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it("should pass formatted choices to inquirer", async () => {
      checkboxMock.mockResolvedValueOnce([]);

      await service.selectEntities(testEntities, defaultConfig);

      expect(checkboxMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Select entities:"),
          choices: expect.arrayContaining([
            expect.objectContaining({
              name: "Entity One - First entity",
              value: 0,
            }),
            expect.objectContaining({
              name: "Entity Two - Second entity",
              value: 1,
            }),
          ]),
        }),
      );
    });

    it("should include suffix when provided", async () => {
      checkboxMock.mockResolvedValueOnce([]);
      const config: EntitySelectionConfig<TestEntity> = {
        ...defaultConfig,
        suffix: "Use space to select, enter to confirm",
      };

      await service.selectEntities(testEntities, config);

      expect(checkboxMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "Use space to select, enter to confirm",
          ),
        }),
      );
    });

    it("should preserve entity references, not copies", async () => {
      checkboxMock.mockResolvedValueOnce([1]);

      const result = await service.selectEntities(testEntities, defaultConfig);

      // Strict reference equality
      expect(result.selected[0]).toBe(testEntities[1]);
    });
  });

  describe("textInput", () => {
    it("should return trimmed input value", async () => {
      inputMock.mockResolvedValueOnce("  test value  ");

      const result = await service.textInput({ message: "Enter value:" });

      expect(result).toBe("test value");
    });

    it("should return undefined for empty input when not required", async () => {
      inputMock.mockResolvedValueOnce("   ");

      const result = await service.textInput({ message: "Enter value:" });

      expect(result).toBeUndefined();
    });

    it("should include suffix when provided", async () => {
      inputMock.mockResolvedValueOnce("test");

      await service.textInput({
        message: "Enter value:",
        suffix: "Optional field",
      });

      expect(inputMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Optional field"),
        }),
      );
    });

    it("should pass validation function to inquirer", async () => {
      inputMock.mockResolvedValueOnce("valid");

      await service.textInput({
        message: "Enter value:",
        required: true,
        validate: (input) => input.length > 2 || "Too short",
      });

      // Verify prompt was called with a validate function
      const promptCall = inputMock.mock.calls[0][0] as { validate?: unknown };
      expect(promptCall.validate).toBeDefined();
    });
  });

  describe("multiTextInput", () => {
    it("should parse comma-separated values", async () => {
      inputMock.mockResolvedValueOnce("one, two, three");

      const result = await service.multiTextInput({ message: "Enter values:" });

      expect(result).toEqual(["one", "two", "three"]);
    });

    it("should filter empty values", async () => {
      inputMock.mockResolvedValueOnce("one, , two,  , three");

      const result = await service.multiTextInput({ message: "Enter values:" });

      expect(result).toEqual(["one", "two", "three"]);
    });

    it("should use custom separator", async () => {
      inputMock.mockResolvedValueOnce("one; two; three");

      const result = await service.multiTextInput({
        message: "Enter values:",
        separator: ";",
      });

      expect(result).toEqual(["one", "two", "three"]);
    });

    it("should return empty array for empty input", async () => {
      inputMock.mockResolvedValueOnce("");

      const result = await service.multiTextInput({ message: "Enter values:" });

      expect(result).toEqual([]);
    });

    it("should trim individual values", async () => {
      inputMock.mockResolvedValueOnce("  one  ,  two  ");

      const result = await service.multiTextInput({ message: "Enter values:" });

      expect(result).toEqual(["one", "two"]);
    });
  });

  describe("displayInfo", () => {
    it("should display formatted items with spacing and color", () => {
      const items = [
        { id: "1", text: "First" },
        { id: "2", text: "Second" },
      ];

      service.displayInfo("Test Items:", items, (item) => item.text);

      // First call is spacing, second is title, then items
      expect(consoleSpy).toHaveBeenCalledTimes(4);
      // Title is colored with chalk.yellow, items with chalk.dim
      // We just verify the calls were made with something containing our text
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test Items:"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("First"));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Second"),
      );
    });

    it("should not display anything for empty items", () => {
      service.displayInfo(
        "Empty:",
        [] as { text: string }[],
        (item) => item.text,
      );

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
