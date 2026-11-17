import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalViewWorkerGateway } from "../../../../../../../src/application/context/host/workers/view/LocalViewWorkerGateway.js";
import { IWorkerIdentityReader } from "../../../../../../../src/application/host/workers/IWorkerIdentityReader.js";
import { ISettingsReader } from "../../../../../../../src/application/settings/ISettingsReader.js";
import { WorkerId } from "../../../../../../../src/application/host/workers/WorkerId.js";

describe("LocalViewWorkerGateway", () => {
  let gateway: LocalViewWorkerGateway;
  let mockWorkerIdentityReader: jest.Mocked<IWorkerIdentityReader>;
  let mockSettingsReader: jest.Mocked<ISettingsReader>;

  beforeEach(() => {
    mockWorkerIdentityReader = {
      workerId: "worker-abc-123" as WorkerId,
    } as jest.Mocked<IWorkerIdentityReader>;

    mockSettingsReader = {
      read: jest.fn(),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    } as jest.Mocked<ISettingsReader>;

    gateway = new LocalViewWorkerGateway(
      mockWorkerIdentityReader,
      mockSettingsReader
    );
  });

  it("should return workerId and claimDurationMinutes", async () => {
    mockSettingsReader.read.mockResolvedValue({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 45 },
      telemetry: { enabled: false, anonymousId: null, consentGiven: false },
    });

    const response = await gateway.viewWorker({});

    expect(response).toEqual({
      workerId: "worker-abc-123",
      claimDurationMinutes: 45,
    });
  });

  it("should read settings from settingsReader", async () => {
    mockSettingsReader.read.mockResolvedValue({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: false, anonymousId: null, consentGiven: false },
    });

    await gateway.viewWorker({});

    expect(mockSettingsReader.read).toHaveBeenCalledTimes(1);
  });
});
