import { describe, expect, it } from "@jest/globals";
import { NoOpTelemetryClient } from "../../../../src/infrastructure/telemetry/NoOpTelemetryClient.js";

describe("NoOpTelemetryClient", () => {
  it("accepts track, flush, and shutdown without side effects", async () => {
    const client = new NoOpTelemetryClient();

    expect(() => client.track("test-event", { ok: true })).not.toThrow();
    await expect(client.flush()).resolves.toBeUndefined();
    await expect(client.shutdown()).resolves.toBeUndefined();
  });
});
