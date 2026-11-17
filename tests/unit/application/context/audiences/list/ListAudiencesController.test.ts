import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ListAudiencesController } from "../../../../../../src/application/context/audiences/list/ListAudiencesController.js";
import { IListAudiencesGateway } from "../../../../../../src/application/context/audiences/list/IListAudiencesGateway.js";
import { ListAudiencesResponse } from "../../../../../../src/application/context/audiences/list/ListAudiencesResponse.js";
import { AudienceView } from "../../../../../../src/application/context/audiences/AudienceView.js";

describe("ListAudiencesController", () => {
  let controller: ListAudiencesController;
  let mockGateway: jest.Mocked<IListAudiencesGateway>;

  beforeEach(() => {
    mockGateway = {
      listAudiences: jest.fn(),
    } as jest.Mocked<IListAudiencesGateway>;

    controller = new ListAudiencesController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockAudiences: AudienceView[] = [
      {
        audienceId: "audience_123",
        name: "Software Developers",
        description: "Professional developers building applications",
        priority: "primary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];
    const expectedResponse: ListAudiencesResponse = { audiences: mockAudiences };
    mockGateway.listAudiences.mockResolvedValue(expectedResponse);

    const result = await controller.handle({});

    expect(result).toEqual(expectedResponse);
    expect(mockGateway.listAudiences).toHaveBeenCalledWith({});
    expect(mockGateway.listAudiences).toHaveBeenCalledTimes(1);
  });

  it("should return empty audiences when gateway returns none", async () => {
    const expectedResponse: ListAudiencesResponse = { audiences: [] };
    mockGateway.listAudiences.mockResolvedValue(expectedResponse);

    const result = await controller.handle({});

    expect(result).toEqual(expectedResponse);
    expect(result.audiences).toHaveLength(0);
  });
});
