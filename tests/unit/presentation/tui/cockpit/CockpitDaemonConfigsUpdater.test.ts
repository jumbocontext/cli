import { describe, expect, it } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIGS } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { updateSelectedCockpitDaemonConfig } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonConfigsUpdater.js";

describe("CockpitDaemonConfigsUpdater", () => {
  it("updates only the selected daemon config", () => {
    const configs = updateSelectedCockpitDaemonConfig(
      DEFAULT_WORKER_DAEMON_CONFIGS,
      "reviewer",
      (config) => ({ ...config, agentId: "claude" }),
    );

    expect(configs.reviewer.agentId).toBe("claude");
    expect(configs.refiner).toBe(DEFAULT_WORKER_DAEMON_CONFIGS.refiner);
    expect(configs.codifier).toBe(DEFAULT_WORKER_DAEMON_CONFIGS.codifier);
  });

  it("passes the selected daemon config to the updater", () => {
    const configs = updateSelectedCockpitDaemonConfig(
      DEFAULT_WORKER_DAEMON_CONFIGS,
      "codifier",
      (config) => ({
        ...config,
        pollIntervalMs: config.pollIntervalMs + 1_000,
      }),
    );

    expect(configs.codifier.pollIntervalMs).toBe(
      DEFAULT_WORKER_DAEMON_CONFIGS.codifier.pollIntervalMs + 1_000,
    );
  });
});
