import { jest, describe, it, expect } from "@jest/globals";
import { IntervalTicker } from "../../../../src/infrastructure/daemons/IntervalTicker";

describe("IntervalTicker", () => {
  it("resolves after the configured interval", async () => {
    jest.useFakeTimers();
    const promise = new IntervalTicker(250).wait();

    jest.advanceTimersByTime(249);
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
    jest.useRealTimers();
  });
});
