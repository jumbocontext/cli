import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { ILogger } from "../../../../../src/application/logging/ILogger";
import { GoalEventType, GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalReinstatedEvent } from "../../../../../src/domain/goals/reinstate/GoalReinstatedEvent";
import { FsGoalReinstatedEventStore } from "../../../../../src/infrastructure/context/goals/reinstate/FsGoalReinstatedEventStore";

const logger: ILogger = {
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
  debug: () => undefined,
};

describe("FsGoalReinstatedEventStore", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-reinstated-store-"));
  });

  afterEach(async () => {
    await fs.remove(rootDir);
  });

  it("persists and reads a reinstated event through the goal stream", async () => {
    const store = new FsGoalReinstatedEventStore(rootDir, logger);
    const event: GoalReinstatedEvent = {
      type: GoalEventType.REINSTATED,
      aggregateId: "goal_123",
      version: 3,
      timestamp: "2026-09-11T11:00:00.000Z",
      payload: { status: GoalStatus.TODO },
    };

    await store.append(event);

    await expect(store.readStream("goal_123")).resolves.toContainEqual(event);
  });
});
