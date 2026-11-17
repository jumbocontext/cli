import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddAudienceController } from "../../../../../../src/application/context/audiences/add/AddAudienceController.js";
import { IAddAudienceGateway } from "../../../../../../src/application/context/audiences/add/IAddAudienceGateway.js";

describe("AddAudienceController", () => {
  let controller: AddAudienceController;
  let mockGateway: jest.Mocked<IAddAudienceGateway>;

  beforeEach(() => {
    mockGateway = {
      addAudience: jest.fn(),
    } as jest.Mocked<IAddAudienceGateway>;

    controller = new AddAudienceController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      name: "Software Developers",
      description: "Professional developers building LLM-powered applications",
      priority: "primary" as const,
    };

    const expectedResponse = {
      audienceId: "audience-123",
      name: "Software Developers",
      description: "Professional developers building LLM-powered applications",
      priority: "primary",
    };

    mockGateway.addAudience.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addAudience).toHaveBeenCalledWith(request);
  });
});
