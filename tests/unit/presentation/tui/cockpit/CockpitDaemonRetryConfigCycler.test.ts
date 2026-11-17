import { describe, expect, it } from "@jest/globals";
import { getNextCockpitDaemonRetryConfig } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonRetryConfigCycler.js";

describe("CockpitDaemonRetryConfigCycler", () => {
  it("cycles to the next configured daemon retry count", () => {
    const config = { agentId: "codex", pollIntervalMs: 30_000, maxRetries: 3 };

    expect(getNextCockpitDaemonRetryConfig(config)).toEqual({
      agentId: "codex",
      pollIntervalMs: 30_000,
      maxRetries: 5,
    });
  });

  it("starts at the first retry count when the current retry count is not configured", () => {
    expect(getNextCockpitDaemonRetryConfig({
      agentId: "codex",
      pollIntervalMs: 30_000,
      maxRetries: 7,
    })).toEqual({
      agentId: "codex",
      pollIntervalMs: 30_000,
      maxRetries: 1,
    });
  });
});
