import { describe, expect, it, jest } from "@jest/globals";
import { POSTHOG_SHUTDOWN_TIMEOUT_MS } from "../../../../src/infrastructure/telemetry/PostHogTelemetryConstants.js";
import { PostHogTelemetryClient } from "../../../../src/infrastructure/telemetry/PostHogTelemetryClient.js";

describe("PostHogTelemetryClient", () => {
  it("captures events with the anonymous identifier", () => {
    const capture = jest.fn();
    const client = new PostHogTelemetryClient("anon-123", () => ({ capture, shutdown: jest.fn() }));
    client.track("goal_started", { source: "test" });
    expect(capture).toHaveBeenCalledWith({
      distinctId: "anon-123", event: "goal_started", properties: { source: "test" },
    });
  });

  it("isolates SDK capture errors", () => {
    const client = new PostHogTelemetryClient("anon-123", () => ({
      capture: () => { throw new Error("capture failed"); }, shutdown: jest.fn(),
    }));
    expect(() => client.track("goal_started", { source: "test" })).not.toThrow();
  });

  it("delegates flush to PostHog shutdown with timeout", async () => {
    const shutdown = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const client = new PostHogTelemetryClient("anon-123", () => ({ capture: jest.fn(), shutdown }));
    await expect(client.flush()).resolves.toBeUndefined();
    expect(shutdown).toHaveBeenCalledWith(POSTHOG_SHUTDOWN_TIMEOUT_MS);
  });

  it("isolates SDK shutdown errors", async () => {
    const client = new PostHogTelemetryClient("anon-123", () => ({
      capture: jest.fn(), shutdown: () => { throw new Error("shutdown failed"); },
    }));
    await expect(client.shutdown()).resolves.toBeUndefined();
  });
});
