import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_WORKER_DAEMON_CONFIG,
  DEFAULT_WORKER_DAEMON_CONFIGS,
  WORKER_DAEMON_NAMES,
} from "../../../../src/application/daemons/WorkerDaemonCatalog.js";

describe("WorkerDaemonCatalog", () => {
  it("centralizes worker daemon names and default daemon config", () => {
    expect(WORKER_DAEMON_NAMES).toEqual(["reviewer", "refiner", "codifier"]);
    expect(DEFAULT_WORKER_DAEMON_CONFIG).toEqual({
      agentId: "codex",
      pollIntervalMs: 30000,
      maxRetries: 3,
    });
    expect(DEFAULT_WORKER_DAEMON_CONFIGS).toEqual({
      reviewer: DEFAULT_WORKER_DAEMON_CONFIG,
      refiner: DEFAULT_WORKER_DAEMON_CONFIG,
      codifier: DEFAULT_WORKER_DAEMON_CONFIG,
    });
  });
});
