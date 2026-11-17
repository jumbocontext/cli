/**
 * Tests for guidelines.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { guidelinesList } from "../../../../../../../src/presentation/cli/commands/guidelines/list/guidelines.list.js";
import { GetGuidelinesController } from "../../../../../../../src/application/context/guidelines/get/GetGuidelinesController.js";
import { GuidelineView } from "../../../../../../../src/application/context/guidelines/GuidelineView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { GuidelinesListDependencies } from "../../../../../../../src/presentation/cli/commands/guidelines/list/guidelines.list.js";

describe("guidelines.list command", () => {
  let mockContainer: Partial<GuidelinesListDependencies>;
  let mockController: jest.Mocked<Pick<GetGuidelinesController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getGuidelinesController: mockController as unknown as GetGuidelinesController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all guidelines by default", async () => {
    const mockGuidelines: GuidelineView[] = [
      {
        guidelineId: "guideline_123",
        category: "testing",
        title: "Write unit tests for all functions",
        description: "Every function should have corresponding unit tests",
        rationale: "Ensures code quality and prevents regressions",
        examples: ["src/utils/math.test.ts"],
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ guidelines: mockGuidelines });

    await guidelinesList({}, mockContainer as GuidelinesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ category: undefined });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by category when specified", async () => {
    mockController.handle.mockResolvedValue({ guidelines: [] });

    await guidelinesList({ category: "testing" }, mockContainer as GuidelinesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ category: "testing" });
  });

  it("should show info message when no guidelines exist", async () => {
    mockController.handle.mockResolvedValue({ guidelines: [] });

    await guidelinesList({}, mockContainer as GuidelinesListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockGuidelines: GuidelineView[] = [
      {
        guidelineId: "guideline_123",
        category: "codingStyle",
        title: "Use camelCase",
        description: "Variables should use camelCase",
        rationale: "Consistency",
        examples: [],
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockController.handle.mockResolvedValue({ guidelines: mockGuidelines });

    await guidelinesList({}, mockContainer as GuidelinesListDependencies);

    expect(mockController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by codingStyle category", async () => {
    mockController.handle.mockResolvedValue({ guidelines: [] });

    await guidelinesList({ category: "codingStyle" }, mockContainer as GuidelinesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ category: "codingStyle" });
  });

  it("should filter by security category", async () => {
    mockController.handle.mockResolvedValue({ guidelines: [] });

    await guidelinesList({ category: "security" }, mockContainer as GuidelinesListDependencies);

    expect(mockController.handle).toHaveBeenCalledWith({ category: "security" });
  });
});
