import { describe, expect, it } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { DaemonEventRowMessageFormatter } from "../../../../../src/presentation/tui/cockpit/DaemonEventRowMessageFormatter.js";

describe("DaemonEventRowMessageFormatter", () => {
  it("formats message, goal, attempt, exit, and error details", () => {
    const message = DaemonEventRowMessageFormatter.format(snapshot(["stderr fallback"]), {
      daemon: "reviewer",
      status: "processing",
      message: "review failed",
      goalId: "goal_123456789",
      attempt: 2,
      maxRetries: 3,
      exitCode: 1,
      errorMessage: "explicit error",
    });

    expect(message).toContain("review failed");
    expect(message).toContain("goal_123");
    expect(message).toContain("2/3");
    expect(message).toContain("exit 1");
    expect(message).toContain("explicit error");
  });

  it("falls back to the latest stderr line and bounds display length", () => {
    const message = DaemonEventRowMessageFormatter.format(snapshot(["first", "fallback error"]), {
      daemon: "reviewer",
      status: "processing",
      message: "x".repeat(80),
    });

    expect(message).toHaveLength(52);
    expect(message.endsWith("...")).toBe(true);
  });
});

function snapshot(stderr: readonly string[]) {
  return {
    name: "reviewer" as const,
    status: "running" as const,
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr,
    events: [],
  };
}
