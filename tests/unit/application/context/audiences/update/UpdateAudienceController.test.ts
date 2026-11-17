import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateAudienceController } from "../../../../../../src/application/context/audiences/update/UpdateAudienceController.js";
import { IUpdateAudienceGateway } from "../../../../../../src/application/context/audiences/update/IUpdateAudienceGateway.js";
import { AudienceView } from "../../../../../../src/application/context/audiences/AudienceView.js";

describe("UpdateAudienceController", () => {
  let controller: UpdateAudienceController;
  let mockGateway: jest.Mocked<IUpdateAudienceGateway>;

  const audienceId = "audience_test123";
  const mockView: AudienceView = {
    audienceId,
    name: "Updated name",
    description: "Updated description",
    priority: "primary",
    isRemoved: false,
    version: 2,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T11:00:00Z",
  };

  beforeEach(() => {
    mockGateway = {
      updateAudience: jest.fn(),
    } as jest.Mocked<IUpdateAudienceGateway>;

    controller = new UpdateAudienceController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.updateAudience.mockResolvedValue({ audienceId, view: mockView });

    const response = await controller.handle({
      audienceId,
      name: "Updated name",
    });

    expect(response.audienceId).toBe(audienceId);
    expect(response.view).toEqual(mockView);
    expect(mockGateway.updateAudience).toHaveBeenCalledWith({
      audienceId,
      name: "Updated name",
    });
  });

  it("should pass all request fields through to gateway", async () => {
    mockGateway.updateAudience.mockResolvedValue({ audienceId, view: mockView });

    await controller.handle({
      audienceId,
      name: "New name",
      description: "New description",
      priority: "secondary",
    });

    expect(mockGateway.updateAudience).toHaveBeenCalledWith({
      audienceId,
      name: "New name",
      description: "New description",
      priority: "secondary",
    });
  });
});
