import { jest, describe, it, expect } from "@jest/globals";
import { ProcessSignalSource } from "../../../../src/infrastructure/daemons/ProcessSignalSource";

describe("ProcessSignalSource", () => {
  it("notifies shutdown callbacks when a process signal is received", () => {
    const source = new ProcessSignalSource();
    const callback = jest.fn();
    source.onShutdown(callback);

    process.emit("SIGTERM", "SIGTERM");

    expect(source.isShutdownRequested).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
