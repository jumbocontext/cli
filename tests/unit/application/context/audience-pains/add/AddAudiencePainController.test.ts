import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddAudiencePainController } from "../../../../../../src/application/context/audience-pains/add/AddAudiencePainController.js";
import { IAddAudiencePainGateway } from "../../../../../../src/application/context/audience-pains/add/IAddAudiencePainGateway.js";

describe("AddAudiencePainController", () => {
  let controller: AddAudiencePainController;
  let mockGateway: jest.Mocked<IAddAudiencePainGateway>;

  beforeEach(() => {
    mockGateway = {
      addAudiencePain: jest.fn(),
    } as jest.Mocked<IAddAudiencePainGateway>;

    controller = new AddAudiencePainController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      title: "Context loss",
      description: "LLMs lose context between sessions",
    };

    const expectedResponse = {
      painId: "pain-123",
      title: "Context loss",
      description: "LLMs lose context between sessions",
      version: 1,
    };

    mockGateway.addAudiencePain.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addAudiencePain).toHaveBeenCalledWith(request);
  });
});
