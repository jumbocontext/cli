import { describe, expect, it } from "@jest/globals";
import { SubprocessNoOpLogger } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessNoOpLogger.js";

describe("SubprocessNoOpLogger", () => {
  it("provides the ILogger methods used by subprocess orchestration without side effects", () => {
    expect(() => {
      SubprocessNoOpLogger.error("error");
      SubprocessNoOpLogger.warn("warn");
      SubprocessNoOpLogger.info("info");
      SubprocessNoOpLogger.debug("debug");
    }).not.toThrow();
  });
});
