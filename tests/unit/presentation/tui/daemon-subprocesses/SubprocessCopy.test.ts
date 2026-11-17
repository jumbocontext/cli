import { describe, expect, it } from "@jest/globals";
import { SubprocessCopy } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessCopy.js";

describe("SubprocessCopy", () => {
  it("defines the expected copy keys for lifecycle and log behaviors", () => {
    expect(SubprocessCopy).toHaveProperty("terminationRequested");
    expect(SubprocessCopy).toHaveProperty("processStopped");
    expect(SubprocessCopy).toHaveProperty("processFailed");
    expect(SubprocessCopy).toHaveProperty("spawnRequestedLog");
    expect(SubprocessCopy).toHaveProperty("startedLog");
    expect(SubprocessCopy).toHaveProperty("stdoutLog");
    expect(SubprocessCopy).toHaveProperty("stderrLog");
    expect(SubprocessCopy).toHaveProperty("closedLog");
    expect(SubprocessCopy).toHaveProperty("errorLog");
    expect(SubprocessCopy).toHaveProperty("terminationRequestedLog");
    expect(SubprocessCopy).toHaveProperty("terminationCompletedLog");
    expect(SubprocessCopy).toHaveProperty("terminationFailedLog");
    expect(SubprocessCopy).toHaveProperty("eventLog");
  });

  it("keeps all expected log tokens non-empty for render and diagnostics", () => {
    for (const value of Object.values(SubprocessCopy)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
