/**
 * Tests for FsGoalClosedEventStore
 *
 * Verifies the file system event store for goal closed events
 * extends FsEventStore.
 */

import fs from "fs-extra";
import * as path from "path";
import { FsGoalClosedEventStore } from "../../../../../../src/infrastructure/context/goals/close/FsGoalClosedEventStore";
import { FsEventStore } from "../../../../../../src/infrastructure/persistence/FsEventStore";
import os from "os";

describe("FsGoalClosedEventStore", () => {
  let tmpDir: string;
  let store: FsGoalClosedEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-closed-events-"));
    store = new FsGoalClosedEventStore(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("should be an instance of FsEventStore", () => {
    expect(store).toBeInstanceOf(FsEventStore);
  });
});
