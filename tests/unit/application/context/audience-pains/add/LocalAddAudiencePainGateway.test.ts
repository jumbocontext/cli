import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddAudiencePainGateway } from "../../../../../../src/application/context/audience-pains/add/LocalAddAudiencePainGateway.js";
import { AddAudiencePainCommandHandler } from "../../../../../../src/application/context/audience-pains/add/AddAudiencePainCommandHandler.js";
import { IAudiencePainUpdateReader } from "../../../../../../src/application/context/audience-pains/update/IAudiencePainUpdateReader.js";
import { UUID } from "../../../../../../src/domain/BaseEvent.js";

describe("LocalAddAudiencePainGateway", () => {
  let gateway: LocalAddAudiencePainGateway;
  let mockCommandHandler: jest.Mocked<AddAudiencePainCommandHandler>;
  let mockPainReader: jest.Mocked<IAudiencePainUpdateReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddAudiencePainCommandHandler>;

    mockPainReader = {
      findById: jest.fn(),
    } as jest.Mocked<IAudiencePainUpdateReader>;

    gateway = new LocalAddAudiencePainGateway(mockCommandHandler, mockPainReader);
  });

  it("should execute command and return response with version from view", async () => {
    const painId = "pain-123" as UUID;

    mockCommandHandler.execute.mockResolvedValue({ painId });
    mockPainReader.findById.mockResolvedValue({
      painId,
      title: "Context loss",
      description: "LLMs lose context between sessions",
      status: "active",
      resolvedAt: null,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    const response = await gateway.addAudiencePain({
      title: "Context loss",
      description: "LLMs lose context between sessions",
    });

    expect(response.painId).toBe(painId);
    expect(response.title).toBe("Context loss");
    expect(response.description).toBe("LLMs lose context between sessions");
    expect(response.version).toBe(1);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      title: "Context loss",
      description: "LLMs lose context between sessions",
    });
    expect(mockPainReader.findById).toHaveBeenCalledWith(painId);
  });

  it("should return null version when view is not found", async () => {
    const painId = "pain-456" as UUID;

    mockCommandHandler.execute.mockResolvedValue({ painId });
    mockPainReader.findById.mockResolvedValue(null);

    const response = await gateway.addAudiencePain({
      title: "Token costs",
      description: "High costs from repeated context loading",
    });

    expect(response.painId).toBe(painId);
    expect(response.version).toBeNull();
  });
});
