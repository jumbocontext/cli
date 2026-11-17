import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalListAudiencesGateway } from "../../../../../../src/application/context/audiences/list/LocalListAudiencesGateway.js";
import { IAudienceContextReader } from "../../../../../../src/application/context/audiences/query/IAudienceContextReader.js";
import { AudienceView } from "../../../../../../src/application/context/audiences/AudienceView.js";

describe("LocalListAudiencesGateway", () => {
  let gateway: LocalListAudiencesGateway;
  let mockReader: jest.Mocked<IAudienceContextReader>;

  beforeEach(() => {
    mockReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IAudienceContextReader>;

    gateway = new LocalListAudiencesGateway(mockReader);
  });

  it("should return all active audiences from reader", async () => {
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
      {
        audienceId: "audience_456",
        name: "DevOps Engineers",
        description: "Engineers managing infrastructure",
        priority: "secondary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T11:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockReader.findAllActive.mockResolvedValue(mockAudiences);

    const result = await gateway.listAudiences({});

    expect(result.audiences).toEqual(mockAudiences);
    expect(result.audiences).toHaveLength(2);
    expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("should return empty array when no audiences exist", async () => {
    mockReader.findAllActive.mockResolvedValue([]);

    const result = await gateway.listAudiences({});

    expect(result.audiences).toEqual([]);
    expect(result.audiences).toHaveLength(0);
    expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("should preserve audience ordering from reader", async () => {
    const orderedAudiences: AudienceView[] = [
      {
        audienceId: "audience_primary",
        name: "Primary Audience",
        description: "First priority",
        priority: "primary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
      {
        audienceId: "audience_secondary",
        name: "Secondary Audience",
        description: "Second priority",
        priority: "secondary",
        isRemoved: false,
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T09:00:00Z",
      },
    ];

    mockReader.findAllActive.mockResolvedValue(orderedAudiences);

    const result = await gateway.listAudiences({});

    expect(result.audiences[0].priority).toBe("primary");
    expect(result.audiences[1].priority).toBe("secondary");
  });
});
