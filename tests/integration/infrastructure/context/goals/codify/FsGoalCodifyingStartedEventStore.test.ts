/**
 * Tests for FsGoalCodifyingStartedEventStore
 *
 * Verifies the file system event store for goal codifying started events
 * extends FsEventStore.
 */

import fs from "fs-extra";
import * as path from "path";
import { FsGoalCodifyingStartedEventStore } from "../../../../../../src/infrastructure/context/goals/codify/FsGoalCodifyingStartedEventStore";
import { FsEventStore } from "../../../../../../src/infrastructure/persistence/FsEventStore";
import os from "os";

describe("FsGoalCodifyingStartedEventStore", () => {
  let tmpDir: string;
  let store: FsGoalCodifyingStartedEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-codifying-events-"));
    store = new FsGoalCodifyingStartedEventStore(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("should be an instance of FsEventStore", () => {
    expect(store).toBeInstanceOf(FsEventStore);
  });
});
