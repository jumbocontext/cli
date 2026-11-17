import { describe, expect, it } from "@jest/globals";
import { getNextCockpitDaemonAgentConfig } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonAgentConfigCycler.js";

describe("CockpitDaemonAgentConfigCycler", () => {
  it("cycles to the next configured daemon agent", () => {
    const config = { agentId: "codex", pollIntervalMs: 30_000, maxRetries: 3 };

    expect(getNextCockpitDaemonAgentConfig(config)).toEqual({
      agentId: "claude",
      pollIntervalMs: 30_000,
      maxRetries: 3,
    });
  });

  it("cycles from Claude to Antigravity instead of retired Gemini", () => {
    const config = { agentId: "claude", pollIntervalMs: 30_000, maxRetries: 3 };

    expect(getNextCockpitDaemonAgentConfig(config)).toEqual({
      agentId: "antigravity",
      pollIntervalMs: 30_000,
      maxRetries: 3,
    });
  });

  it("cycles from Copilot to Vibe without offering Cursor", () => {
    const config = { agentId: "copilot", pollIntervalMs: 30_000, maxRetries: 3 };

    expect(getNextCockpitDaemonAgentConfig(config)).toEqual({
      agentId: "vibe",
      pollIntervalMs: 30_000,
      maxRetries: 3,
    });
  });

  it("starts at the first agent when the current agent is not configured", () => {
    expect(getNextCockpitDaemonAgentConfig({
      agentId: "unknown-agent",
      pollIntervalMs: 30_000,
      maxRetries: 3,
    })).toEqual({
      agentId: "codex",
      pollIntervalMs: 30_000,
      maxRetries: 3,
    });
  });
});
