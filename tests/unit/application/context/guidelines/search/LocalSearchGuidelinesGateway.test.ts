import { describe, it, expect, jest } from "@jest/globals";
import { IGuidelineViewReader } from "../../../../../../src/application/context/guidelines/get/IGuidelineViewReader.js";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";
import { LocalSearchGuidelinesGateway } from "../../../../../../src/application/context/guidelines/search/LocalSearchGuidelinesGateway.js";

describe("LocalSearchGuidelinesGateway", () => {
  it("should delegate to guidelineViewReader.search with criteria", async () => {
    const expectedGuidelines: GuidelineView[] = [
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

    const mockReader: jest.Mocked<IGuidelineViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IGuidelineViewReader["search"]>().mockResolvedValue(expectedGuidelines),
    };

    const gateway = new LocalSearchGuidelinesGateway(mockReader);
    const result = await gateway.searchGuidelines({ criteria: { category: "testing", title: "Test" } });

    expect(mockReader.search).toHaveBeenCalledWith({ category: "testing", title: "Test" });
    expect(result.guidelines).toEqual(expectedGuidelines);
  });

  it("should return empty guidelines when search finds no matches", async () => {
    const mockReader: jest.Mocked<IGuidelineViewReader> = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn<IGuidelineViewReader["search"]>().mockResolvedValue([]),
    };

    const gateway = new LocalSearchGuidelinesGateway(mockReader);
    const result = await gateway.searchGuidelines({ criteria: { query: "nonexistent" } });

    expect(result.guidelines).toEqual([]);
  });
});
