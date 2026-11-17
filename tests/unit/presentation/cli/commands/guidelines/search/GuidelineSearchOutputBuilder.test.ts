import { describe, it, expect, beforeEach } from "@jest/globals";
import { GuidelineView } from "../../../../../../../src/application/context/guidelines/GuidelineView.js";
import { GuidelineSearchOutputBuilder } from "../../../../../../../src/presentation/cli/commands/guidelines/search/GuidelineSearchOutputBuilder.js";

describe("GuidelineSearchOutputBuilder", () => {
  let outputBuilder: GuidelineSearchOutputBuilder;

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
    {
      guidelineId: "guide_2",
      category: "codingStyle",
      title: "Keep output centralized",
      description: "Use output builders for CLI copy",
      rationale: "Keeps command handlers thin",
      examples: [],
      isRemoved: false,
      removedAt: null,
      removalReason: null,
      version: 1,
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    outputBuilder = new GuidelineSearchOutputBuilder();
  });

  describe("build (TTY output)", () => {
    it("should render guideline count and details in default format", () => {
      const output = outputBuilder.build(mockGuidelines, "default");
      const text = output.toHumanReadable();

      expect(text).toContain("Guidelines (2)");
      expect(text).toContain("Test behavior");
      expect(text).toContain("Cover important behavior");
      expect(text).toContain("Prevents regressions");
      expect(text).toContain("tests/example.test.ts");
      expect(text).toContain("guide_1");
    });

    it("should render only id, category, and title in compact format", () => {
      const output = outputBuilder.build(mockGuidelines, "compact");
      const text = output.toHumanReadable();

      expect(text).toContain("guide_1");
      expect(text).toContain("testing");
      expect(text).toContain("Test behavior");
      expect(text).not.toContain("Cover important behavior");
      expect(text).not.toContain("Rationale:");
    });

    it("should render empty state message", () => {
      const output = outputBuilder.build([], "default");
      const text = output.toHumanReadable();

      expect(text).toContain("No guidelines matched the search criteria.");
    });
  });

  describe("buildStructuredOutput (JSON output)", () => {
    it("should include full guideline data in default format", () => {
      const output = outputBuilder.buildStructuredOutput(mockGuidelines, "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; guidelines: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.guidelines[0].guidelineId).toBe("guide_1");
      expect(data.guidelines[0].category).toBe("testing");
      expect(data.guidelines[0].description).toBe("Cover important behavior");
      expect(data.guidelines[0].examples).toEqual(["tests/example.test.ts"]);
      expect(data.guidelines[0].version).toBe(1);
    });

    it("should include only id, category, and title in compact format", () => {
      const output = outputBuilder.buildStructuredOutput(mockGuidelines, "compact");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; guidelines: Record<string, unknown>[] };

      expect(data.count).toBe(2);
      expect(data.guidelines[0]).toEqual({
        guidelineId: "guide_1",
        category: "testing",
        title: "Test behavior",
      });
      expect(data.guidelines[0]).not.toHaveProperty("description");
      expect(data.guidelines[0]).not.toHaveProperty("examples");
    });

    it("should return zero count and empty array", () => {
      const output = outputBuilder.buildStructuredOutput([], "default");
      const dataSection = output.getSections().find(s => s.type === "data");
      const data = dataSection!.content as { count: number; guidelines: unknown[] };

      expect(data.count).toBe(0);
      expect(data.guidelines).toEqual([]);
    });
  });
});
