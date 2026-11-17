import fs from "fs-extra";
import * as path from "path";
import { FsArchitectureDeprecatedEventStore } from "../../../../../../src/infrastructure/context/architecture/deprecate/FsArchitectureDeprecatedEventStore.js";
import { ILogger } from "../../../../../../src/application/logging/ILogger.js";
import { ArchitectureEventType } from "../../../../../../src/domain/architecture/Constants.js";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent.js";
import { jest } from "@jest/globals";
import os from "os";

const mockLogger: ILogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

describe("FsArchitectureDeprecatedEventStore", () => {
  let tmpDir: string;
  let store: FsArchitectureDeprecatedEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-arch-deprecated-"));
    store = new FsArchitectureDeprecatedEventStore(tmpDir, mockLogger);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("should append a deprecated event and return sequence 1", async () => {
    const event: BaseEvent = {
      type: ArchitectureEventType.DEPRECATED,
      aggregateId: "architecture",
      version: 2,
      timestamp: "2025-06-01T00:00:00.000Z",
    };

    const result = await store.append(event);
    expect(result.nextSeq).toBe(1);
  });

  it("should persist event to filesystem", async () => {
    const event: BaseEvent = {
      type: ArchitectureEventType.DEPRECATED,
      aggregateId: "architecture",
      version: 2,
      timestamp: "2025-06-01T00:00:00.000Z",
    };

    await store.append(event);

    const streamDir = path.join(tmpDir, "events", "architecture");
    const files = await fs.readdir(streamDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("ArchitectureDeprecatedEvent");
  });
});
