/**
 * Tests for sessions.list CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sessionsList } from "../../../../../../../src/presentation/cli/commands/sessions/list/sessions.list.js";
import { GetSessionsController } from "../../../../../../../src/application/context/sessions/get/GetSessionsController.js";
import { SessionView } from "../../../../../../../src/application/context/sessions/SessionView.js";
import { Renderer } from "../../../../../../../src/presentation/cli/rendering/Renderer.js";
import type { SessionsListDependencies } from "../../../../../../../src/presentation/cli/commands/sessions/list/sessions.list.js";

describe("sessions.list command", () => {
  let mockContainer: Partial<SessionsListDependencies>;
  let mockGetSessionsController: jest.Mocked<Pick<GetSessionsController, "handle">>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockGetSessionsController = {
      handle: jest.fn(),
    };

    mockContainer = {
      getSessionsController: mockGetSessionsController as unknown as GetSessionsController,
    };

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("should list all sessions by default", async () => {
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

    mockGetSessionsController.handle.mockResolvedValue({ sessions: mockSessions });

    await sessionsList({}, mockContainer as SessionsListDependencies);

    expect(mockGetSessionsController.handle).toHaveBeenCalledWith({ status: "all" });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should filter by status when specified", async () => {
    mockGetSessionsController.handle.mockResolvedValue({ sessions: [] });

    await sessionsList({ status: "active" }, mockContainer as SessionsListDependencies);

    expect(mockGetSessionsController.handle).toHaveBeenCalledWith({ status: "active" });
  });

  it("should show info message when no sessions exist", async () => {
    mockGetSessionsController.handle.mockResolvedValue({ sessions: [] });

    await sessionsList({}, mockContainer as SessionsListDependencies);

    expect(mockGetSessionsController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should output JSON format when configured", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    const mockSessions: SessionView[] = [
      {
        sessionId: "session_123",
        focus: "Test",
        status: "ended",
        contextSnapshot: null,
        version: 1,
        startedAt: "2025-01-01T10:00:00Z",
        endedAt: "2025-01-01T11:00:00Z",
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
      },
    ];

    mockGetSessionsController.handle.mockResolvedValue({ sessions: mockSessions });

    await sessionsList({}, mockContainer as SessionsListDependencies);

    expect(mockGetSessionsController.handle).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
