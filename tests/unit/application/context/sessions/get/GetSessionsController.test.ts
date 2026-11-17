import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetSessionsController } from "../../../../../../src/application/context/sessions/get/GetSessionsController.js";
import { IGetSessionsGateway } from "../../../../../../src/application/context/sessions/get/IGetSessionsGateway.js";
import { SessionView } from "../../../../../../src/application/context/sessions/SessionView.js";

describe("GetSessionsController", () => {
  let controller: GetSessionsController;
  let mockGateway: jest.Mocked<IGetSessionsGateway>;

  beforeEach(() => {
    mockGateway = {
      getSessions: jest.fn(),
    } as jest.Mocked<IGetSessionsGateway>;

    controller = new GetSessionsController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockSessions: SessionView[] = [
      {
        sessionId: "session_123",
        focus: "Feature development",
        status: "active",
        contextSnapshot: null,
        version: 1,
        startedAt: "2025-01-01T10:00:00Z",
        endedAt: null,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      },
    ];

    mockGateway.getSessions.mockResolvedValue({ sessions: mockSessions });

    const response = await controller.handle({ status: "all" });

    expect(response.sessions).toEqual(mockSessions);
    expect(mockGateway.getSessions).toHaveBeenCalledWith({ status: "all" });
  });

  it("should pass status filter through to gateway", async () => {
    mockGateway.getSessions.mockResolvedValue({ sessions: [] });

    await controller.handle({ status: "active" });

    expect(mockGateway.getSessions).toHaveBeenCalledWith({ status: "active" });
  });
});
