import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalStartSessionGateway } from "../../../../../../src/application/context/sessions/start/LocalStartSessionGateway.js";
import { StartSessionCommandHandler } from "../../../../../../src/application/context/sessions/start/StartSessionCommandHandler.js";
import { IBrownfieldStatusReader } from "../../../../../../src/application/context/sessions/start/IBrownfieldStatusReader.js";
import { ISettingsReader } from "../../../../../../src/application/settings/ISettingsReader.js";
import { DEFAULT_SETTINGS } from "../../../../../../src/infrastructure/settings/DefaultSettings.js";
import { GoalBacklogPreviewQueryHandler } from "../../../../../../src/application/context/goals/query/GoalBacklogPreviewQueryHandler.js";

describe("LocalStartSessionGateway", () => {
  let startSessionCommandHandler: jest.Mocked<StartSessionCommandHandler>;
  let brownfieldStatusReader: jest.Mocked<IBrownfieldStatusReader>;
  let settingsReader: jest.Mocked<ISettingsReader>;
  let backlogPreviewQueryHandler: jest.Mocked<GoalBacklogPreviewQueryHandler>;
  let gateway: LocalStartSessionGateway;

  beforeEach(() => {
    startSessionCommandHandler = {
      execute: jest.fn().mockResolvedValue({ sessionId: "session_test-123" }),
    } as unknown as jest.Mocked<StartSessionCommandHandler>;

    brownfieldStatusReader = {
      isUnprimed: jest.fn().mockResolvedValue(false),
    } as jest.Mocked<IBrownfieldStatusReader>;

    settingsReader = {
      read: jest.fn().mockResolvedValue(DEFAULT_SETTINGS),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    } as jest.Mocked<ISettingsReader>;

    backlogPreviewQueryHandler = {
      execute: jest.fn().mockResolvedValue([
        {
          goalId: "goal_1",
          title: "Preview goal",
          status: "refined",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    } as unknown as jest.Mocked<GoalBacklogPreviewQueryHandler>;

    gateway = new LocalStartSessionGateway(
      startSessionCommandHandler,
      brownfieldStatusReader,
      settingsReader,
      backlogPreviewQueryHandler
    );
  });

  it("should start a session and return router state", async () => {
    const result = await gateway.startSession({});

    expect(result).toEqual({
      sessionId: "session_test-123",
      status: "active",
      isUnprimedBrownfield: false,
      backlogPreview: [
        {
          goalId: "goal_1",
          title: "Preview goal",
          status: "refined",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    expect(startSessionCommandHandler.execute).toHaveBeenCalledWith({});
  });

  it("should check brownfield status via qualifier", async () => {
    await gateway.startSession({});

    expect(brownfieldStatusReader.isUnprimed).toHaveBeenCalledTimes(1);
  });

  it("should use configured backlog preview size", async () => {
    settingsReader.read.mockResolvedValue({
      ...DEFAULT_SETTINGS,
      session: { backlogPreviewSize: 2 },
    });

    await gateway.startSession({});

    expect(backlogPreviewQueryHandler.execute).toHaveBeenCalledWith(2);
  });

  it("should default backlog preview size when older settings omit session settings", async () => {
    settingsReader.read.mockResolvedValue({
      ...DEFAULT_SETTINGS,
      session: undefined,
    });

    await gateway.startSession({});

    expect(backlogPreviewQueryHandler.execute).toHaveBeenCalledWith(5);
  });

  it("should preserve unprimed brownfield signal", async () => {
    brownfieldStatusReader.isUnprimed.mockResolvedValue(true);

    const result = await gateway.startSession({});

    expect(result.isUnprimedBrownfield).toBe(true);
  });
});
