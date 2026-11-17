import { RemoveGuidelineController } from "../../../../../../src/application/context/guidelines/remove/RemoveGuidelineController";
import { IRemoveGuidelineGateway } from "../../../../../../src/application/context/guidelines/remove/IRemoveGuidelineGateway";
import { jest } from "@jest/globals";

describe("RemoveGuidelineController", () => {
  let controller: RemoveGuidelineController;
  let mockGateway: jest.Mocked<IRemoveGuidelineGateway>;

  beforeEach(() => {
    mockGateway = {
      removeGuideline: jest.fn(),
    } as jest.Mocked<IRemoveGuidelineGateway>;

    controller = new RemoveGuidelineController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      guidelineId: "gl_123",
      reason: "No longer needed",
    };

    const expectedResponse = {
      guidelineId: "gl_123",
      title: "80% coverage required",
    };

    mockGateway.removeGuideline.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeGuideline).toHaveBeenCalledWith(request);
  });
});
