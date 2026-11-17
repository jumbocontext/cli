import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetValuePropositionsController } from "../../../../../../src/application/context/value-propositions/get/GetValuePropositionsController.js";
import { IGetValuePropositionsGateway } from "../../../../../../src/application/context/value-propositions/get/IGetValuePropositionsGateway.js";
import { GetValuePropositionsResponse } from "../../../../../../src/application/context/value-propositions/get/GetValuePropositionsResponse.js";

describe("GetValuePropositionsController", () => {
  let controller: GetValuePropositionsController;
  let mockGateway: jest.Mocked<IGetValuePropositionsGateway>;

  beforeEach(() => {
    mockGateway = {
      getValuePropositions: jest.fn(),
    } as jest.Mocked<IGetValuePropositionsGateway>;

    controller = new GetValuePropositionsController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const expectedResponse: GetValuePropositionsResponse = {
      values: [
        {
          valuePropositionId: "value_123",
          title: "Persistent Context",
          description: "Context that persists across sessions",
          benefit: "Never lose context again",
          measurableOutcome: "100% context retention",
          version: 1,
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
        },
      ],
    };

    mockGateway.getValuePropositions.mockResolvedValue(expectedResponse);

    const result = await controller.handle({});

    expect(result).toEqual(expectedResponse);
    expect(mockGateway.getValuePropositions).toHaveBeenCalledWith({});
    expect(mockGateway.getValuePropositions).toHaveBeenCalledTimes(1);
  });

  it("should return empty values when gateway returns none", async () => {
    const expectedResponse: GetValuePropositionsResponse = { values: [] };

    mockGateway.getValuePropositions.mockResolvedValue(expectedResponse);

    const result = await controller.handle({});

    expect(result).toEqual(expectedResponse);
    expect(result.values).toHaveLength(0);
  });
});
