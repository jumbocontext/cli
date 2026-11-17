import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionStartController } from "../../../../../../src/application/context/sessions/start/SessionStartController.js";
import { IStartSessionGateway } from "../../../../../../src/application/context/sessions/start/IStartSessionGateway.js";
import { SessionStartResponse } from "../../../../../../src/application/context/sessions/start/SessionStartResponse.js";

describe("SessionStartController", () => {
  let controller: SessionStartController;
  let mockGateway: jest.Mocked<IStartSessionGateway>;

  const mockResponse: SessionStartResponse = {
    sessionId: "session_test-123",
    status: "active",
    isUnprimedBrownfield: false,
    backlogPreview: [],
  };

  beforeEach(() => {
    mockGateway = {
      startSession: jest.fn(),
    } as jest.Mocked<IStartSessionGateway>;

    controller = new SessionStartController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    mockGateway.startSession.mockResolvedValue(mockResponse);

    const response = await controller.handle({});

    expect(response).toBe(mockResponse);
    expect(mockGateway.startSession).toHaveBeenCalledWith({});
  });

  it("should pass request through to gateway", async () => {
    mockGateway.startSession.mockResolvedValue(mockResponse);

    await controller.handle({});

    expect(mockGateway.startSession).toHaveBeenCalledTimes(1);
  });
});
