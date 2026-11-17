import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RemoveValuePropositionController } from "../../../../../../src/application/context/value-propositions/remove/RemoveValuePropositionController.js";
import { IRemoveValuePropositionGateway } from "../../../../../../src/application/context/value-propositions/remove/IRemoveValuePropositionGateway.js";

describe("RemoveValuePropositionController", () => {
  let controller: RemoveValuePropositionController;
  let mockGateway: jest.Mocked<IRemoveValuePropositionGateway>;

  beforeEach(() => {
    mockGateway = {
      removeValueProposition: jest.fn(),
    } as jest.Mocked<IRemoveValuePropositionGateway>;

    controller = new RemoveValuePropositionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      valuePropositionId: "vp-123",
    };

    const expectedResponse = {
      valuePropositionId: "vp-123",
      title: "Fast onboarding",
    };

    mockGateway.removeValueProposition.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.removeValueProposition).toHaveBeenCalledWith(request);
  });
});
