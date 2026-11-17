import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalAddAudienceGateway } from "../../../../../../src/application/context/audiences/add/LocalAddAudienceGateway.js";
import { AddAudienceCommandHandler } from "../../../../../../src/application/context/audiences/add/AddAudienceCommandHandler.js";
import { UUID } from "../../../../../../src/domain/BaseEvent.js";

describe("LocalAddAudienceGateway", () => {
  let gateway: LocalAddAudienceGateway;
  let mockCommandHandler: jest.Mocked<AddAudienceCommandHandler>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddAudienceCommandHandler>;

    gateway = new LocalAddAudienceGateway(mockCommandHandler);
  });

  it("should execute command and return response", async () => {
    const audienceId = "audience-123" as UUID;

    mockCommandHandler.execute.mockResolvedValue({ audienceId });

    const response = await gateway.addAudience({
      name: "Software Developers",
      description: "Professional developers building LLM-powered applications",
      priority: "primary",
    });

    expect(response.audienceId).toBe(audienceId);
    expect(response.name).toBe("Software Developers");
    expect(response.description).toBe("Professional developers building LLM-powered applications");
    expect(response.priority).toBe("primary");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      name: "Software Developers",
      description: "Professional developers building LLM-powered applications",
      priority: "primary",
    });
  });
});
