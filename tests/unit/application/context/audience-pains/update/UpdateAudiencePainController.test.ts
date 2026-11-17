import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateAudiencePainController } from "../../../../../../src/application/context/audience-pains/update/UpdateAudiencePainController.js";
import { IUpdateAudiencePainGateway } from "../../../../../../src/application/context/audience-pains/update/IUpdateAudiencePainGateway.js";
import { AudiencePainView } from "../../../../../../src/application/context/audience-pains/AudiencePainView.js";

describe("UpdateAudiencePainController", () => {
  let controller: UpdateAudiencePainController;
  let mockGateway: jest.Mocked<IUpdateAudiencePainGateway>;

  const painId = "pain_test123";
  const mockView: AudiencePainView = {
    painId,
    title: "Updated title",
    description: "Updated description",
    status: "active",
    resolvedAt: null,
    version: 2,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T11:00:00Z",
  };

  beforeEach(() => {
    mockGateway = {
      updateAudiencePain: jest.fn(),
    } as jest.Mocked<IUpdateAudiencePainGateway>;

    controller = new UpdateAudiencePainController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.updateAudiencePain.mockResolvedValue({ painId, view: mockView });

    const response = await controller.handle({
      painId,
      title: "Updated title",
    });

    expect(response.painId).toBe(painId);
    expect(response.view).toEqual(mockView);
    expect(mockGateway.updateAudiencePain).toHaveBeenCalledWith({
      painId,
      title: "Updated title",
    });
  });

  it("should pass all request fields through to gateway", async () => {
    mockGateway.updateAudiencePain.mockResolvedValue({ painId, view: mockView });

    await controller.handle({
      painId,
      title: "New title",
      description: "New description",
    });

    expect(mockGateway.updateAudiencePain).toHaveBeenCalledWith({
      painId,
      title: "New title",
      description: "New description",
    });
  });
});
