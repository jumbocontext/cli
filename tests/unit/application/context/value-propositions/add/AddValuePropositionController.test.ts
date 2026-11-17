import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddValuePropositionController } from "../../../../../../src/application/context/value-propositions/add/AddValuePropositionController.js";
import { IAddValuePropositionGateway } from "../../../../../../src/application/context/value-propositions/add/IAddValuePropositionGateway.js";

describe("AddValuePropositionController", () => {
  let controller: AddValuePropositionController;
  let mockGateway: jest.Mocked<IAddValuePropositionGateway>;

  beforeEach(() => {
    mockGateway = {
      addValueProposition: jest.fn(),
    } as jest.Mocked<IAddValuePropositionGateway>;

    controller = new AddValuePropositionController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      title: "Persistent context",
      description: "Maintain context across sessions",
      benefit: "Developers don't lose work",
      measurableOutcome: "Zero context loss",
    };

    const expectedResponse = {
      valuePropositionId: "value_123",
      title: "Persistent context",
      measurableOutcome: "Zero context loss",
    };

    mockGateway.addValueProposition.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addValueProposition).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      title: "Model-agnostic",
      description: "Works with any LLM",
      benefit: "Switch providers freely",
    };

    const expectedResponse = {
      valuePropositionId: "value_456",
      title: "Model-agnostic",
    };

    mockGateway.addValueProposition.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addValueProposition).toHaveBeenCalledWith(request);
  });
});
