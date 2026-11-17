import { jest, describe, it, expect } from "@jest/globals";
import { PollingLoop } from "../../../../src/application/daemons/PollingLoop";

describe("PollingLoop", () => {
  it("processes work and waits after idle results until shutdown is requested", async () => {
    let shutdownCallback: (() => void) | undefined;
    const processManager = {
      processNext: jest.fn()
        .mockResolvedValueOnce({ status: "idle", attempts: 0 })
        .mockResolvedValueOnce({ status: "completed", attempts: 1 }),
    };
    const ticker = {
      wait: jest.fn(async () => {
        shutdownCallback?.();
      }),
    };
    const shutdownSignal = {
      isShutdownRequested: false,
      onShutdown: jest.fn((callback: () => void) => {
        shutdownCallback = callback;
      }),
    };

    await new PollingLoop().run({
      processManager,
      processOptions: { agentId: "codex", maxRetries: 1 },
      ticker,
      shutdownSignal,
    });

    expect(processManager.processNext).toHaveBeenCalledTimes(1);
    expect(ticker.wait).toHaveBeenCalledTimes(1);
  });

  it.each(["completed", "skipped", "failed", "exhausted"] as const)(
    "continues polling after %s results until shutdown is requested",
    async (status) => {
      let shutdownCallback: (() => void) | undefined;
      const processManager = {
        processNext: jest.fn()
          .mockResolvedValueOnce({ status, attempts: 1 })
          .mockResolvedValueOnce({ status: "idle", attempts: 0 }),
      };
      const ticker = {
        wait: jest.fn(async () => {
          if (ticker.wait.mock.calls.length === 2) {
            shutdownCallback?.();
          }
        }),
      };
      const shutdownSignal = {
        isShutdownRequested: false,
        onShutdown: jest.fn((callback: () => void) => {
          shutdownCallback = callback;
        }),
      };

      await new PollingLoop().run({
        processManager,
        processOptions: { agentId: "codex", maxRetries: 1 },
        ticker,
        shutdownSignal,
      });

      expect(processManager.processNext).toHaveBeenCalledTimes(2);
      expect(ticker.wait).toHaveBeenCalledTimes(2);
    },
  );
});
