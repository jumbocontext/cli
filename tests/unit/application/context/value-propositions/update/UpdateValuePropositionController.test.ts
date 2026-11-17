import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UpdateValuePropositionController } from "../../../../../../src/application/context/value-propositions/update/UpdateValuePropositionController.js";
import { IUpdateValuePropositionGateway } from "../../../../../../src/application/context/value-propositions/update/IUpdateValuePropositionGateway.js";

describe("UpdateValuePropositionController", () => {
  let controller: UpdateValuePropositionController;
  let mockGateway: jest.Mocked<IUpdateValuePropositionGateway>;

  beforeEach(() => {
    mockGateway = {
      updateValueProposition: jest.fn(),
    } as jest.Mocked<IUpdateValuePropositionGateway>;

    controller = new UpdateValuePropositionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      id: "vp-123",
      title: "Updated Title",
    };

    const expectedResponse = {
      valuePropositionId: "vp-123",
      title: "Updated Title",
      version: 2,
    };

    mockGateway.updateValueProposition.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.updateValueProposition).toHaveBeenCalledWith(request);
  });
});
