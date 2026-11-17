import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateAudienceGateway } from "../../../../../../src/application/context/audiences/update/LocalUpdateAudienceGateway.js";
import { UpdateAudienceCommandHandler } from "../../../../../../src/application/context/audiences/update/UpdateAudienceCommandHandler.js";
import { IAudienceUpdateReader } from "../../../../../../src/application/context/audiences/update/IAudienceUpdateReader.js";
import { AudienceView } from "../../../../../../src/application/context/audiences/AudienceView.js";

describe("LocalUpdateAudienceGateway", () => {
  let gateway: LocalUpdateAudienceGateway;
  let mockCommandHandler: jest.Mocked<UpdateAudienceCommandHandler>;
  let mockReader: jest.Mocked<IAudienceUpdateReader>;

  const audienceId = "audience_test123";
  const mockView: AudienceView = {
    audienceId,
    name: "Updated name",
    description: "Original description",
    priority: "primary",
    isRemoved: false,
    version: 2,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T11:00:00Z",
  };

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateAudienceCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IAudienceUpdateReader>;

    gateway = new LocalUpdateAudienceGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return updated view", async () => {
    mockCommandHandler.execute.mockResolvedValue({ audienceId });
    mockReader.findById.mockResolvedValue(mockView);

    const response = await gateway.updateAudience({
      audienceId,
      name: "Updated name",
    });

    expect(response.audienceId).toBe(audienceId);
    expect(response.view).toEqual(mockView);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      audienceId,
      name: "Updated name",
      description: undefined,
      priority: undefined,
    });
    expect(mockReader.findById).toHaveBeenCalledWith(audienceId);
  });

  it("should pass all fields to command handler", async () => {
    mockCommandHandler.execute.mockResolvedValue({ audienceId });
    mockReader.findById.mockResolvedValue(mockView);

    await gateway.updateAudience({
      audienceId,
      name: "New name",
      description: "New description",
      priority: "secondary",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      audienceId,
      name: "New name",
      description: "New description",
      priority: "secondary",
    });
  });

  it("should return null view when reader returns null", async () => {
    mockCommandHandler.execute.mockResolvedValue({ audienceId });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.updateAudience({
      audienceId,
      name: "Updated name",
    });

    expect(response.audienceId).toBe(audienceId);
    expect(response.view).toBeNull();
  });
});
