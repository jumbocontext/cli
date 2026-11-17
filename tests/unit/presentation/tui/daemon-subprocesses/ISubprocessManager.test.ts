import { describe, expect, it, jest } from "@jest/globals";
import type { ISubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";
import type { DaemonConfig } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonConfig.js";
import type { DaemonName } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonName.js";
import type { SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessSnapshot.js";

const config: DaemonConfig = {
  agentId: "codex",
  pollIntervalMs: 30000,
  maxRetries: 3,
};

const snapshot: SubprocessSnapshot = {
  name: "refiner",
  status: "running",
  config,
  stdout: [],
  stderr: [],
  events: [],
};

describe("ISubprocessManager", () => {
  it("defines the subprocess-control contract around explicit daemon snapshot concepts", async () => {
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (_name: DaemonName, _config?: Partial<DaemonConfig>) => snapshot),
      terminate: jest.fn(async (_name: DaemonName) => ({ ...snapshot, status: "stopped" })),
      terminateAll: jest.fn<() => Promise<void>>().mockResolvedValue(),
      getStatus: jest.fn((_name: DaemonName) => snapshot),
      getAllStatuses: jest.fn(() => [snapshot]),
    };

    await expect(manager.spawn("refiner", { pollIntervalMs: 10000 })).resolves.toEqual(snapshot);
    expect(manager.getStatus("refiner")).toBe(snapshot);
    expect(manager.getAllStatuses()).toEqual([snapshot]);
  });
});
