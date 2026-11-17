/**
 * Tests for WorkerRecordMapper
 *
 * Verifies the infrastructure-to-application boundary mapping:
 * WorkerRecord to WorkerId and WorkerMode conversions.
 */

import { WorkerRecordMapper } from "../../../../../src/infrastructure/host/workers/WorkerRecordMapper";
import { WorkerRecord } from "../../../../../src/infrastructure/host/workers/WorkerRecord";

describe("WorkerRecordMapper", () => {
  let mapper: WorkerRecordMapper;

  beforeEach(() => {
    mapper = new WorkerRecordMapper();
  });

  function buildRecord(overrides: Partial<WorkerRecord> = {}): WorkerRecord {
    return {
      workerId: "abc-123-def-456",
      hostSessionKey: "session-key-1",
      mode: null,
      createdAt: "2026-03-01T10:00:00.000Z",
      lastSeenAt: "2026-03-01T10:00:00.000Z",
      ...overrides,
    };
  }

  describe("toWorkerId", () => {
    it("returns a branded WorkerId from record", () => {
      const record = buildRecord({ workerId: "worker-uuid-value" });

      const workerId = mapper.toWorkerId(record);

      expect(workerId).toBe("worker-uuid-value");
    });
  });

  describe("toWorkerMode", () => {
    it("returns null when mode is null", () => {
      const record = buildRecord({ mode: null });

      const mode = mapper.toWorkerMode(record);

      expect(mode).toBeNull();
    });

    it("returns 'plan' for plan mode", () => {
      const record = buildRecord({ mode: "plan" });

      const mode = mapper.toWorkerMode(record);

      expect(mode).toBe("plan");
    });

    it("returns 'implement' for implement mode", () => {
      const record = buildRecord({ mode: "implement" });

      const mode = mapper.toWorkerMode(record);

      expect(mode).toBe("implement");
    });

    it("returns 'review' for review mode", () => {
      const record = buildRecord({ mode: "review" });

      const mode = mapper.toWorkerMode(record);

      expect(mode).toBe("review");
    });

    it("returns 'codify' for codify mode", () => {
      const record = buildRecord({ mode: "codify" });

      const mode = mapper.toWorkerMode(record);

      expect(mode).toBe("codify");
    });

    it("returns null for unrecognized mode value", () => {
      const record = buildRecord({ mode: "invalid-mode" });

      const mode = mapper.toWorkerMode(record);

      expect(mode).toBeNull();
    });
  });
});
