import { describe, expect, it } from "@jest/globals";
import { getNextCockpitDaemonPollConfig } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPollConfigCycler.js";

describe("CockpitDaemonPollConfigCycler", () => {
  it("cycles to the next configured daemon poll interval", () => {
    const config = { agentId: "codex", pollIntervalMs: 30_000, maxRetries: 3 };

    expect(getNextCockpitDaemonPollConfig(config)).toEqual({
      agentId: "codex",
      pollIntervalMs: 60_000,
      maxRetries: 3,
    });
  });

  it("starts at the first poll interval when the current interval is not configured", () => {
    expect(getNextCockpitDaemonPollConfig({
      agentId: "codex",
      pollIntervalMs: 45_000,
      maxRetries: 3,
    })).toEqual({
      agentId: "codex",
      pollIntervalMs: 10_000,
      maxRetries: 3,
    });
  });
});
