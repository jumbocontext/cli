import fs from "fs-extra";
import * as path from "path";
import { FsEventStore } from "../../../../src/infrastructure/persistence/FsEventStore";
import { BaseEvent } from "../../../../src/domain/BaseEvent";
import { ILogger } from "../../../../src/application/logging/ILogger";
import { jest } from "@jest/globals";
import os from "os";

const mockLogger: ILogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

describe("FsEventStore", () => {
  let tmpDir: string;
  let store: FsEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-events-"));
    store = new FsEventStore(tmpDir, mockLogger);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("appends event with sequence 1 for new stream", async () => {
    const event: BaseEvent = {
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    };

    const result = await store.append(event);
    expect(result.nextSeq).toBe(1);
  });

  it("increments sequence for multiple events", async () => {
    const base: BaseEvent = {
      type: "Test",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    };

    const r1 = await store.append(base);
    const r2 = await store.append(base);
    const r3 = await store.append(base);

    expect(r1.nextSeq).toBe(1);
    expect(r2.nextSeq).toBe(2);
    expect(r3.nextSeq).toBe(3);
  });

  it("creates directory structure automatically", async () => {
    await store.append({
      type: "Test",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    const dirPath = path.join(tmpDir, "events", "test-1");
    expect(fs.existsSync(dirPath)).toBe(true);
  });

  it("formats filename correctly", async () => {
    await store.append({
      type: "TestEvent",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    const filePath = path.join(tmpDir, "events", "test-1", "000001.TestEvent.json");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("readStream returns events in order", async () => {
    const base = {
      type: "Test",
      aggregateId: "test-1",
      version: 1,
    };

    await store.append({ ...base, timestamp: "2025-01-01T00:00:00.000Z" });
    await store.append({ ...base, timestamp: "2025-01-01T01:00:00.000Z" });

    const events = await store.readStream("test-1");
    expect(events).toHaveLength(2);
    expect(events[0].timestamp).toBe("2025-01-01T00:00:00.000Z");
    expect(events[1].timestamp).toBe("2025-01-01T01:00:00.000Z");
  });

  it("readStream returns empty array for missing stream", async () => {
    const events = await store.readStream("nonexistent");
    expect(events).toEqual([]);
  });

  it("getAllEvents returns sorted by timestamp", async () => {
    await store.append({
      type: "Test",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T02:00:00.000Z",
    });
    await store.append({
      type: "Test",
      aggregateId: "test-2",
      version: 1,
      timestamp: "2025-01-01T01:00:00.000Z",
    });

    const events = await store.getAllEvents();
    expect(events[0].timestamp).toBe("2025-01-01T01:00:00.000Z");
    expect(events[1].timestamp).toBe("2025-01-01T02:00:00.000Z");
  });

  it("pretty-prints JSON with 2 spaces", async () => {
    await store.append({
      type: "Test",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    const filePath = path.join(tmpDir, "events", "test-1", "000001.Test.json");
    const content = await fs.readFile(filePath, "utf-8");

    expect(content).toContain('\n  "type"'); // Verify indentation
    expect(content).toContain('\n  "aggregateId"');
  });

  it("stores seq in file but strips it from returned events", async () => {
    await store.append({
      type: "Test",
      aggregateId: "test-1",
      version: 1,
      timestamp: "2025-01-01T00:00:00.000Z",
    });

    // Verify seq is NOT in returned domain events
    const events = await store.readStream("test-1");
    expect(events[0]).not.toHaveProperty("seq");

    // Verify seq IS in the stored file (infrastructure concern)
    const filePath = path.join(tmpDir, "events", "test-1", "000001.Test.json");
    const fileContent = JSON.parse(await fs.readFile(filePath, "utf-8"));
    expect(fileContent.seq).toBe(1);
  });
});
