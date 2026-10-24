import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GuidelineView } from "../../../../../src/application/context/guidelines/GuidelineView.js";
import { IGuidelineViewReader } from "../../../../../src/application/context/guidelines/get/IGuidelineViewReader.js";
import { LocalShowGuidelineGateway } from "../../../../../src/application/context/guidelines/show/LocalShowGuidelineGateway.js";

describe("LocalShowGuidelineGateway", () => {
  let guidelineViewReader: jest.Mocked<IGuidelineViewReader>;
  let gateway: LocalShowGuidelineGateway;

  const guideline: GuidelineView = {
    guidelineId: "guide_123",
    category: "testing",
    title: "Isolate tests",
    description: "Each test must be independent.",
    rationale: "Prevents cascading failures.",
    examples: ["tests/first.test.ts", "tests/second.test.ts"],
    isRemoved: false,
    removedAt: null,
    removalReason: null,
    version: 3,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-02-01T11:00:00.000Z",
  };

  beforeEach(() => {
    guidelineViewReader = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      search: jest.fn(),
    };
    gateway = new LocalShowGuidelineGateway(guidelineViewReader);
  });

  it.each([false, true])("retrieves the complete view through findByIds (removed=%s)", async (isRemoved) => {
    const view: GuidelineView = {
      ...guideline,
      isRemoved,
      removedAt: isRemoved ? "2026-03-01T12:00:00.000Z" : null,
      removalReason: isRemoved ? "Superseded by linting" : null,
    };
    guidelineViewReader.findByIds.mockResolvedValue([view]);

    const response = await gateway.showGuideline({ guidelineId: guideline.guidelineId });

    expect(response).toEqual({ guideline: view });
    expect(response.guideline).toBe(view);
    expect(guidelineViewReader.findByIds).toHaveBeenCalledTimes(1);
    expect(guidelineViewReader.findByIds).toHaveBeenCalledWith([guideline.guidelineId]);
    expect(guidelineViewReader.findAll).not.toHaveBeenCalled();
    expect(guidelineViewReader.search).not.toHaveBeenCalled();
  });

  it("fails clearly when the guideline ID is unknown", async () => {
    guidelineViewReader.findByIds.mockResolvedValue([]);

    await expect(gateway.showGuideline({ guidelineId: "guide_missing" }))
      .rejects.toThrow("Guideline not found: guide_missing");
  });

  it("propagates reader failures without misclassifying them as not found", async () => {
    const error = new Error("database unavailable");
    guidelineViewReader.findByIds.mockRejectedValue(error);

    await expect(gateway.showGuideline({ guidelineId: guideline.guidelineId })).rejects.toBe(error);
  });
});
