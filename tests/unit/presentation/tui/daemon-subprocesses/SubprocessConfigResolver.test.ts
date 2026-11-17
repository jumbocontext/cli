import { describe, expect, it } from "@jest/globals";
import { SubprocessConfigResolver } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessConfigResolver.js";

describe("SubprocessConfigResolver", () => {
  it("fills unspecified runtime settings from the worker daemon defaults", () => {
    const resolver = new SubprocessConfigResolver();

    expect(resolver.resolve({ agentId: "claude" })).toEqual({
      agentId: "claude",
      pollIntervalMs: 30000,
      maxRetries: 3,
    });
  });
});
