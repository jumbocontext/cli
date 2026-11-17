/**
 * Tests for FsGoalQualifiedEventStore
 *
 * Verifies the file system event store for goal qualified events
 * properly implements IGoalQualifiedEventWriter and IGoalQualifiedEventReader.
 */

import fs from "fs-extra";
import * as path from "path";
import { FsGoalQualifiedEventStore } from "../../../../../../src/infrastructure/context/goals/qualify/FsGoalQualifiedEventStore";
import { IGoalQualifiedEventReader } from "../../../../../../src/application/context/goals/qualify/IGoalQualifiedEventReader";
import { IGoalQualifiedEventWriter } from "../../../../../../src/application/context/goals/qualify/IGoalQualifiedEventWriter";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent";
import os from "os";

describe("FsGoalQualifiedEventStore", () => {
  let tmpDir: string;
  let store: FsGoalQualifiedEventStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-qualified-events-"));
    store = new FsGoalQualifiedEventStore(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("interface compliance", () => {
    it("implements IGoalQualifiedEventReader", () => {
      const reader: IGoalQualifiedEventReader = store;
      expect(reader.readStream).toBeDefined();
    });

    it("implements IGoalQualifiedEventWriter", () => {
      const writer: IGoalQualifiedEventWriter = store;
      expect(writer.append).toBeDefined();
    });
  });

  describe("append", () => {
    it("appends event with sequence 1 for new stream", async () => {
      const event: BaseEvent = {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      const result = await store.append(event);

      expect(result.nextSeq).toBe(1);
    });

    it("creates event file with correct naming", async () => {
      const event: BaseEvent = {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      await store.append(event);

      const filePath = path.join(
        tmpDir,
        "events",
        "goal_test-1",
        "000001.GoalQualifiedEvent.json"
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("persists event payload correctly", async () => {
      const event = {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
        qualifiedBy: "agent_test-1",
      };

      await store.append(event);

      const filePath = path.join(
        tmpDir,
        "events",
        "goal_test-1",
        "000001.GoalQualifiedEvent.json"
      );
      const content = JSON.parse(await fs.readFile(filePath, "utf-8"));

      expect(content.type).toBe("GoalQualifiedEvent");
      expect(content.aggregateId).toBe("goal_test-1");
      expect(content.qualifiedBy).toBe("agent_test-1");
    });
  });

  describe("readStream", () => {
    it("returns empty array for non-existent stream", async () => {
      const events = await store.readStream("goal_nonexistent");

      expect(events).toEqual([]);
    });

    it("returns appended events in order", async () => {
      const event1: BaseEvent = {
        type: "GoalQualifiedEvent",
        aggregateId: "goal_test-1",
        version: 1,
        timestamp: "2026-02-02T10:00:00.000Z",
      };

      const event2: BaseEvent = {
        type: "GoalCompletedEvent",
        aggregateId: "goal_test-1",
        version: 2,
        timestamp: "2026-02-02T11:00:00.000Z",
      };

      await store.append(event1);
      await store.append(event2);

      const events = await store.readStream("goal_test-1");

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe("GoalQualifiedEvent");
      expect(events[1].type).toBe("GoalCompletedEvent");
    });

    it("strips infrastructure metadata from returned events", async () => {
      const event: BaseEvent = {
        type: "GoalQualifiedEvent",
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
