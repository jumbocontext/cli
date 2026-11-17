import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetAudiencePainsGateway } from "../../../../../../src/application/context/audience-pains/list/LocalGetAudiencePainsGateway.js";
import { IAudiencePainContextReader } from "../../../../../../src/application/context/audience-pains/query/IAudiencePainContextReader.js";
import { AudiencePainView } from "../../../../../../src/application/context/audience-pains/AudiencePainView.js";

describe("LocalGetAudiencePainsGateway", () => {
  let gateway: LocalGetAudiencePainsGateway;
  let mockReader: jest.Mocked<IAudiencePainContextReader>;

  beforeEach(() => {
    mockReader = {
      findAllActive: jest.fn(),
    } as jest.Mocked<IAudiencePainContextReader>;

    gateway = new LocalGetAudiencePainsGateway(mockReader);
  });

  it("should return pains from reader", async () => {
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
      {
        painId: "pain_456",
        title: "No Memory Transfer",
        description: "Context not transferable across agents",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T11:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockReader.findAllActive.mockResolvedValue(mockPains);

    const response = await gateway.getAudiencePains({});

    expect(response.pains).toEqual(mockPains);
    expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("should return empty pains when none exist", async () => {
    mockReader.findAllActive.mockResolvedValue([]);

    const response = await gateway.getAudiencePains({});

    expect(response.pains).toEqual([]);
    expect(mockReader.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("should preserve ordering from reader", async () => {
    const orderedPains: AudiencePainView[] = [
      {
        painId: "pain_first",
        title: "First Pain",
        description: "Created first",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T08:00:00Z",
        updatedAt: "2025-01-01T08:00:00Z",
      },
      {
        painId: "pain_second",
        title: "Second Pain",
        description: "Created second",
        status: "active",
        resolvedAt: null,
        version: 1,
        createdAt: "2025-01-01T09:00:00Z",
        updatedAt: "2025-01-01T09:00:00Z",
      },
    ];

    mockReader.findAllActive.mockResolvedValue(orderedPains);

    const response = await gateway.getAudiencePains({});

    expect(response.pains[0].painId).toBe("pain_first");
    expect(response.pains[1].painId).toBe("pain_second");
  });
});
