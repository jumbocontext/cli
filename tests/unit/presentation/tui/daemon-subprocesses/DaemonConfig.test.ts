import { describe, expect, it } from "@jest/globals";
import type {
  DaemonConfig,
  DaemonConfigs,
} from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonConfig.js";
import type { DaemonName } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonName.js";

describe("DaemonConfig", () => {
  it("aliases the worker daemon runtime configuration contract for TUI consumers", () => {
    const config: DaemonConfig = {
      agentId: "codex",
      pollIntervalMs: 30000,
      maxRetries: 3,
    };
    const configs: DaemonConfigs = {
      refiner: config,
      reviewer: config,
      codifier: config,
    };

    expect(configs.refiner).toEqual(config);
    expect(Object.keys(configs)).toEqual(["refiner", "reviewer", "codifier"] satisfies DaemonName[]);
  });
});
