import { describe, expect, it } from "@jest/globals";
import type { SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessSnapshot.js";

describe("SubprocessSnapshot", () => {
  it("captures subprocess state, output buffers, event history, and exit details", () => {
    const snapshot: SubprocessSnapshot = {
      name: "codifier",
      status: "failed",
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
      pid: 42,
      stdout: ["summary"],
      stderr: ["failure"],
      events: [{
        daemon: "codifier",
        status: "failed",
        errorMessage: "failure",
      }],
      exitCode: 1,
      exitSignal: null,
      stopRequested: false,
    };

    expect(snapshot).toEqual(expect.objectContaining({
      name: "codifier",
      status: "failed",
      exitCode: 1,
    }));
  });
});
