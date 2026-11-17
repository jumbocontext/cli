import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalUpdateAudiencePainGateway } from "../../../../../../src/application/context/audience-pains/update/LocalUpdateAudiencePainGateway.js";
import { UpdateAudiencePainCommandHandler } from "../../../../../../src/application/context/audience-pains/update/UpdateAudiencePainCommandHandler.js";
import { IAudiencePainUpdateReader } from "../../../../../../src/application/context/audience-pains/update/IAudiencePainUpdateReader.js";
import { AudiencePainView } from "../../../../../../src/application/context/audience-pains/AudiencePainView.js";

describe("LocalUpdateAudiencePainGateway", () => {
  let gateway: LocalUpdateAudiencePainGateway;
  let mockCommandHandler: jest.Mocked<UpdateAudiencePainCommandHandler>;
  let mockReader: jest.Mocked<IAudiencePainUpdateReader>;

  const painId = "pain_test123";
  const mockView: AudiencePainView = {
    painId,
    title: "Updated title",
    description: "Original description",
    status: "active",
    resolvedAt: null,
    version: 2,
    createdAt: "2025-11-09T10:00:00Z",
    updatedAt: "2025-11-09T11:00:00Z",
  };

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateAudiencePainCommandHandler>;

    mockReader = {
      findById: jest.fn(),
    } as jest.Mocked<IAudiencePainUpdateReader>;

    gateway = new LocalUpdateAudiencePainGateway(mockCommandHandler, mockReader);
  });

  it("should execute command and return updated view", async () => {
    mockCommandHandler.execute.mockResolvedValue({ painId });
    mockReader.findById.mockResolvedValue(mockView);

    const response = await gateway.updateAudiencePain({
      painId,
      title: "Updated title",
    });

    expect(response.painId).toBe(painId);
    expect(response.view).toEqual(mockView);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      painId,
      title: "Updated title",
      description: undefined,
    });
    expect(mockReader.findById).toHaveBeenCalledWith(painId);
  });

  it("should pass title and description to command handler", async () => {
    mockCommandHandler.execute.mockResolvedValue({ painId });
    mockReader.findById.mockResolvedValue(mockView);

    await gateway.updateAudiencePain({
      painId,
      title: "New title",
      description: "New description",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      painId,
      title: "New title",
      description: "New description",
    });
  });

  it("should return null view when reader returns null", async () => {
    mockCommandHandler.execute.mockResolvedValue({ painId });
    mockReader.findById.mockResolvedValue(null);

    const response = await gateway.updateAudiencePain({
      painId,
      title: "Updated title",
    });

    expect(response.painId).toBe(painId);
    expect(response.view).toBeNull();
  });
});
