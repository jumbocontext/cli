import { describe, expect, it, jest } from "@jest/globals";
import { GuidelineView } from "../../../../../src/application/context/guidelines/GuidelineView.js";
import { IShowGuidelineGateway } from "../../../../../src/application/context/guidelines/show/IShowGuidelineGateway.js";
import { ShowGuidelineController } from "../../../../../src/application/context/guidelines/show/ShowGuidelineController.js";
import { ShowGuidelineRequest } from "../../../../../src/application/context/guidelines/show/ShowGuidelineRequest.js";
import { ShowGuidelineResponse } from "../../../../../src/application/context/guidelines/show/ShowGuidelineResponse.js";

describe("ShowGuidelineController", () => {
  it("delegates the typed request and preserves the complete gateway response", async () => {
    const guideline: GuidelineView = {
      guidelineId: "guide_123",
      category: "testing",
      title: "Isolate tests",
      description: "Each test must be independent.",
      rationale: "Prevents cascading failures.",
      examples: [],
      isRemoved: false,
      removedAt: null,
      removalReason: null,
      version: 1,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    };
    const request: ShowGuidelineRequest = { guidelineId: guideline.guidelineId };
    const response: ShowGuidelineResponse = { guideline };
    const gateway: jest.Mocked<IShowGuidelineGateway> = {
      showGuideline: jest.fn<IShowGuidelineGateway["showGuideline"]>().mockResolvedValue(response),
    };
    const controller = new ShowGuidelineController(gateway);

    await expect(controller.handle(request)).resolves.toBe(response);
    expect(gateway.showGuideline).toHaveBeenCalledTimes(1);
    expect(gateway.showGuideline).toHaveBeenCalledWith(request);
  });

  it("propagates gateway failures without replacing them", async () => {
    const error = new Error("reader failed");
    const gateway: jest.Mocked<IShowGuidelineGateway> = {
      showGuideline: jest.fn<IShowGuidelineGateway["showGuideline"]>().mockRejectedValue(error),
    };

    await expect(new ShowGuidelineController(gateway).handle({ guidelineId: "guide_123" }))
      .rejects.toBe(error);
  });
});
