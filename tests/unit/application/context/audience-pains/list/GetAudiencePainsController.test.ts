import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetAudiencePainsController } from "../../../../../../src/application/context/audience-pains/list/GetAudiencePainsController.js";
import { IGetAudiencePainsGateway } from "../../../../../../src/application/context/audience-pains/list/IGetAudiencePainsGateway.js";
import { AudiencePainView } from "../../../../../../src/application/context/audience-pains/AudiencePainView.js";

describe("GetAudiencePainsController", () => {
  let controller: GetAudiencePainsController;
  let mockGateway: jest.Mocked<IGetAudiencePainsGateway>;

  beforeEach(() => {
    mockGateway = {
      getAudiencePains: jest.fn(),
    } as jest.Mocked<IGetAudiencePainsGateway>;

    controller = new GetAudiencePainsController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockPains: AudiencePainView[] = [
      {
        painId: "pain_123",
        title: "Context Loss",
        description: "LLMs lose context between sessions",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGateway.getAudiencePains.mockResolvedValue({ pains: mockPains });

    const response = await controller.handle({});

    expect(response.pains).toEqual(mockPains);
    expect(mockGateway.getAudiencePains).toHaveBeenCalledWith({});
  });

  it("should return empty pains when gateway returns none", async () => {
    mockGateway.getAudiencePains.mockResolvedValue({ pains: [] });

    const response = await controller.handle({});

    expect(response.pains).toEqual([]);
    expect(mockGateway.getAudiencePains).toHaveBeenCalledWith({});
  });
});
