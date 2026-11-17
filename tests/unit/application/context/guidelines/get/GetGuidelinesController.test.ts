/**
 * Tests for GetGuidelinesController
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetGuidelinesController } from "../../../../../../src/application/context/guidelines/get/GetGuidelinesController.js";
import { IGetGuidelinesGateway } from "../../../../../../src/application/context/guidelines/get/IGetGuidelinesGateway.js";
import { GetGuidelinesRequest } from "../../../../../../src/application/context/guidelines/get/GetGuidelinesRequest.js";
import { GetGuidelinesResponse } from "../../../../../../src/application/context/guidelines/get/GetGuidelinesResponse.js";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";

describe("GetGuidelinesController", () => {
  let controller: GetGuidelinesController;
  let mockGateway: jest.Mocked<IGetGuidelinesGateway>;

  beforeEach(() => {
    mockGateway = {
      getGuidelines: jest.fn(),
    } as jest.Mocked<IGetGuidelinesGateway>;

    controller = new GetGuidelinesController(mockGateway);
  });

  it("should delegate to gateway with the request", async () => {
    const request: GetGuidelinesRequest = { category: "testing" };
    const expectedResponse: GetGuidelinesResponse = {
      guidelines: [
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
      ],
    };

    mockGateway.getGuidelines.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(result).toEqual(expectedResponse);
    expect(mockGateway.getGuidelines).toHaveBeenCalledWith(request);
  });

  it("should delegate to gateway with empty request", async () => {
    const request: GetGuidelinesRequest = {};
    const expectedResponse: GetGuidelinesResponse = { guidelines: [] };

    mockGateway.getGuidelines.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(result).toEqual(expectedResponse);
    expect(mockGateway.getGuidelines).toHaveBeenCalledWith(request);
  });
});
