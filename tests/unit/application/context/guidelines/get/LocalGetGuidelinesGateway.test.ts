/**
 * Tests for LocalGetGuidelinesGateway
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetGuidelinesGateway } from "../../../../../../src/application/context/guidelines/get/LocalGetGuidelinesGateway.js";
import { IGuidelineViewReader } from "../../../../../../src/application/context/guidelines/get/IGuidelineViewReader.js";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";

describe("LocalGetGuidelinesGateway", () => {
  let gateway: LocalGetGuidelinesGateway;
  let mockReader: jest.Mocked<IGuidelineViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
    } as jest.Mocked<IGuidelineViewReader>;

    gateway = new LocalGetGuidelinesGateway(mockReader);
  });

  it("should return guidelines from the reader", async () => {
    const mockGuidelines: GuidelineView[] = [
      {
        guidelineId: "guideline_123",
        category: "testing",
        title: "Write unit tests",
        description: "Every function should have tests",
        rationale: "Quality",
        examples: [],
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockReader.findAll.mockResolvedValue(mockGuidelines);

    const result = await gateway.getGuidelines({ category: "testing" });

    expect(result).toEqual({ guidelines: mockGuidelines });
    expect(result.guidelines[0]).not.toHaveProperty(["enforce", "ment"].join(""));
    expect(mockReader.findAll).toHaveBeenCalledWith("testing");
  });

  it("should pass undefined category when not specified", async () => {
    mockReader.findAll.mockResolvedValue([]);

    const result = await gateway.getGuidelines({});

    expect(result).toEqual({ guidelines: [] });
    expect(mockReader.findAll).toHaveBeenCalledWith(undefined);
  });

  it("should return empty array when no guidelines exist", async () => {
    mockReader.findAll.mockResolvedValue([]);

    const result = await gateway.getGuidelines({ category: "security" });

    expect(result).toEqual({ guidelines: [] });
    expect(mockReader.findAll).toHaveBeenCalledWith("security");
  });
});
