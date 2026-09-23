import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { ILogger } from "../../../../../src/application/logging/ILogger";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalPostponedEvent } from "../../../../../src/domain/goals/postpone/GoalPostponedEvent";
import { FsGoalPostponedEventStore } from "../../../../../src/infrastructure/context/goals/postpone/FsGoalPostponedEventStore";

const logger: ILogger = {
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
  debug: () => undefined,
};

describe("FsGoalPostponedEventStore", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-postponed-store-"));
  });

  afterEach(async () => {
    await fs.remove(rootDir);
  });

  it("persists and reads a postponed event through the goal stream", async () => {
    const store = new FsGoalPostponedEventStore(rootDir, logger);
    const event: GoalPostponedEvent = {
      type: GoalEventType.POSTPONED,
      aggregateId: "goal_123",
      version: 2,
      timestamp: "2026-09-11T10:00:00.000Z",
      payload: { status: GoalStatus.POSTPONED },
    };

    await store.append(event);

    await expect(store.readStream("goal_123")).resolves.toContainEqual(event);
  });
});
