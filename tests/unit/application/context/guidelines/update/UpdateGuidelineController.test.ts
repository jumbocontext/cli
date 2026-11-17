import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateGuidelineController } from "../../../../../../src/application/context/guidelines/update/UpdateGuidelineController.js";
import { IUpdateGuidelineGateway } from "../../../../../../src/application/context/guidelines/update/IUpdateGuidelineGateway.js";

describe("UpdateGuidelineController", () => {
  let controller: UpdateGuidelineController;
  let mockGateway: jest.Mocked<IUpdateGuidelineGateway>;

  beforeEach(() => {
    mockGateway = {
      updateGuideline: jest.fn(),
    } as jest.Mocked<IUpdateGuidelineGateway>;

    controller = new UpdateGuidelineController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      id: "guid_123",
      category: "testing" as const,
      title: "Updated Title",
    };

    const expectedResponse = {
      guidelineId: "guid_123",
      updatedFields: ["category", "title"],
      category: "testing",
      title: "Updated Title",
      version: 2,
    };

    mockGateway.updateGuideline.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateGuideline).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      id: "guid_456",
      title: "New Title",
    };

    const expectedResponse = {
      guidelineId: "guid_456",
      updatedFields: ["title"],
      title: "New Title",
      version: 3,
    };

    mockGateway.updateGuideline.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateGuideline).toHaveBeenCalledWith(request);
  });
});
