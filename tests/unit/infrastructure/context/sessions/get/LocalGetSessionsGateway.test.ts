import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalGetSessionsGateway } from "../../../../../../src/application/context/sessions/get/LocalGetSessionsGateway.js";
import { ISessionViewReader } from "../../../../../../src/application/context/sessions/get/ISessionViewReader.js";
import { SessionView } from "../../../../../../src/application/context/sessions/SessionView.js";

describe("LocalGetSessionsGateway", () => {
  let gateway: LocalGetSessionsGateway;
  let mockReader: jest.Mocked<ISessionViewReader>;

  beforeEach(() => {
    mockReader = {
      findAll: jest.fn(),
      findActive: jest.fn(),
    } as jest.Mocked<ISessionViewReader>;

    gateway = new LocalGetSessionsGateway(mockReader);
  });

  it("should return sessions from the view reader", async () => {
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

    mockReader.findAll.mockResolvedValue(mockSessions);

    const response = await gateway.getSessions({ status: "all" });

    expect(response.sessions).toEqual(mockSessions);
    expect(mockReader.findAll).toHaveBeenCalledWith("all");
  });

  it("should pass status filter to the view reader", async () => {
    mockReader.findAll.mockResolvedValue([]);

    await gateway.getSessions({ status: "active" });

    expect(mockReader.findAll).toHaveBeenCalledWith("active");
  });

  it("should return empty sessions array when none exist", async () => {
    mockReader.findAll.mockResolvedValue([]);

    const response = await gateway.getSessions({ status: "all" });

    expect(response.sessions).toEqual([]);
  });
});
