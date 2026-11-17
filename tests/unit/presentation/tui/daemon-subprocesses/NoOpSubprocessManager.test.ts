import { describe, expect, it } from "@jest/globals";
import { NoOpSubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/NoOpSubprocessManager";

describe("NoOpSubprocessManager", () => {
  it("returns stopped snapshots without spawning processes", async () => {
    const manager = new NoOpSubprocessManager();

    await expect(manager.spawn("codifier")).resolves.toEqual({
      name: "codifier",
      status: "stopped",
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
      stdout: [],
      stderr: [],
      events: [],
    });
    expect(manager.getAllStatuses()).toHaveLength(3);
  });
});
