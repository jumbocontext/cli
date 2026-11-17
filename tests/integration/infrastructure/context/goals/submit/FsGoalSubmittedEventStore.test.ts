/**
 * Tests for FsGoalSubmittedEventStore
 *
 * Verifies the file system event store for goal submitted events
 * properly implements IGoalSubmittedEventWriter and IGoalSubmittedEventReader.
 */

import fs from "fs-extra";
import * as path from "path";
import { FsGoalSubmittedEventStore } from "../../../../../../src/infrastructure/context/goals/submit/FsGoalSubmittedEventStore";
import { IGoalSubmittedEventReader } from "../../../../../../src/application/context/goals/submit/IGoalSubmittedEventReader";
import { IGoalSubmittedEventWriter } from "../../../../../../src/application/context/goals/submit/IGoalSubmittedEventWriter";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent";
import os from "os";

describe("FsGoalSubmittedEventStore", () => {
  let tmpDir: string;
  let store: FsGoalSubmittedEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-submit-events-"));
    store = new FsGoalSubmittedEventStore(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("interface compliance", () => {
    it("implements IGoalSubmittedEventReader", () => {
      const reader: IGoalSubmittedEventReader = store;
      expect(reader.readStream).toBeDefined();
    });

    it("implements IGoalSubmittedEventWriter", () => {
      const writer: IGoalSubmittedEventWriter = store;
      expect(writer.append).toBeDefined();
    });
  });

  describe("append", () => {
    it("appends event with sequence 1 for new stream", async () => {
      const event: BaseEvent = {
        type: "GoalSubmittedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      const result = await store.append(event);

      expect(result.nextSeq).toBe(1);
    });

    it("creates event file with correct naming", async () => {
      const event: BaseEvent = {
        type: "GoalSubmittedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      await store.append(event);

      const filePath = path.join(
        tmpDir,
        "events",
        "goal_test-1",
        "000001.GoalSubmittedEvent.json"
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("persists event payload correctly", async () => {
      const event = {
        type: "GoalSubmittedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
        payload: {
          status: "submitted",
          submittedAt: "2026-02-02T10:00:00.000Z",
        },
      };

      await store.append(event);

      const filePath = path.join(
        tmpDir,
        "events",
        "goal_test-1",
        "000001.GoalSubmittedEvent.json"
      );
      const content = JSON.parse(await fs.readFile(filePath, "utf-8"));

      expect(content.type).toBe("GoalSubmittedEvent");
      expect(content.aggregateId).toBe("goal_test-1");
      expect(content.payload.status).toBe("submitted");
    });
  });

  describe("readStream", () => {
    it("returns empty array for non-existent stream", async () => {
      const events = await store.readStream("goal_nonexistent");

      expect(events).toEqual([]);
    });

    it("returns appended events in order", async () => {
      const event1: BaseEvent = {
        type: "GoalSubmittedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      const event2: BaseEvent = {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_test-1",
        version: 2,
        timestamp: "2026-02-02T11:00:00.000Z",
      };

      await store.append(event1);
      await store.append(event2);

      const events = await store.readStream("goal_test-1");

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("GoalSubmittedEvent");
      expect(events[1].type).toBe("GoalQualifiedEvent");
    });

    it("strips infrastructure metadata from returned events", async () => {
      const event: BaseEvent = {
        type: "GoalSubmittedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      await store.append(event);
      const events = await store.readStream("goal_test-1");

      expect(events[0]).not.toHaveProperty("seq");
    });
  });
});
