import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RemoveAudienceController } from "../../../../../../src/application/context/audiences/remove/RemoveAudienceController.js";
import { IRemoveAudienceGateway } from "../../../../../../src/application/context/audiences/remove/IRemoveAudienceGateway.js";

describe("RemoveAudienceController", () => {
  let controller: RemoveAudienceController;
  let mockGateway: jest.Mocked<IRemoveAudienceGateway>;

  beforeEach(() => {
    mockGateway = {
      removeAudience: jest.fn(),
    } as jest.Mocked<IRemoveAudienceGateway>;

    controller = new RemoveAudienceController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      audienceId: "audience-123",
      reason: "No longer in target market",
    };

    const expectedResponse = {
      audienceId: "audience-123",
      name: "Enterprise Developers",
    };

    mockGateway.removeAudience.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeAudience).toHaveBeenCalledWith(request);
  });
});
