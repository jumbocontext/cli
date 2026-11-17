/**
 * Tests for FsWorkerIdentifiedEventStore
 *
 * Verifies the file system event store for worker identified events
 * extends FsEventStore.
 */

import fs from "fs-extra";
import * as path from "path";
import { FsWorkerIdentifiedEventStore } from "../../../../../../src/infrastructure/host/workers/identify/FsWorkerIdentifiedEventStore";
import { FsEventStore } from "../../../../../../src/infrastructure/persistence/FsEventStore";
import os from "os";

describe("FsWorkerIdentifiedEventStore", () => {
  let tmpDir: string;
  let store: FsWorkerIdentifiedEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-worker-identified-events-"));
    store = new FsWorkerIdentifiedEventStore(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("should be an instance of FsEventStore", () => {
    expect(store).toBeInstanceOf(FsEventStore);
  });
});
