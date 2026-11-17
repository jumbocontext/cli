import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRemoveAudienceGateway } from "../../../../../../src/application/context/audiences/remove/LocalRemoveAudienceGateway.js";
import { RemoveAudienceCommandHandler } from "../../../../../../src/application/context/audiences/remove/RemoveAudienceCommandHandler.js";
import { IAudienceRemoveReader } from "../../../../../../src/application/context/audiences/remove/IAudienceRemoveReader.js";
import { UUID } from "../../../../../../src/domain/BaseEvent.js";

describe("LocalRemoveAudienceGateway", () => {
  let gateway: LocalRemoveAudienceGateway;
  let mockCommandHandler: jest.Mocked<RemoveAudienceCommandHandler>;
  let mockReader: jest.Mocked<IAudienceRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveAudienceCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IAudienceRemoveReader>;

    gateway = new LocalRemoveAudienceGateway(mockCommandHandler, mockReader);
  });

  it("should look up audience, execute command, and return response with name", async () => {
    const audienceId = "audience-123" as UUID;

    mockReader.findById.mockResolvedValue({
      audienceId,
      name: "Enterprise Developers",
      description: "Developers in enterprise orgs",
      priority: "primary",
      isRemoved: false,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });
    mockCommandHandler.execute.mockResolvedValue({ audienceId });

    const response = await gateway.removeAudience({
      audienceId,
      reason: "No longer in target market",
    });

    expect(response.audienceId).toBe(audienceId);
    expect(response.name).toBe("Enterprise Developers");
    expect(mockReader.findById).toHaveBeenCalledWith(audienceId);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      audienceId,
      reason: "No longer in target market",
    });
  });

  it("should throw when audience is not found", async () => {
    mockReader.findById.mockResolvedValue(null);

    await expect(
      gateway.removeAudience({
        audienceId: "nonexistent-id",
      })
    ).rejects.toThrow("Audience not found: nonexistent-id");

    expect(mockCommandHandler.execute).not.toHaveBeenCalled();
  });
});
