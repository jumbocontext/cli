import Database from "better-sqlite3";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ReinstateGoalController } from "../../../../../src/application/context/goals/reinstate/ReinstateGoalController";
import { Goal } from "../../../../../src/domain/goals/Goal";
import { GoalId } from "../../../../../src/domain/goals/GoalId";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { SqliteGetGoalViewReader } from "../../../../../src/infrastructure/context/goals/get/SqliteGetGoalViewReader";
import { FsGoalReinstatedEventStore } from "../../../../../src/infrastructure/context/goals/reinstate/FsGoalReinstatedEventStore";
import { SqliteGoalReinstatedProjector } from "../../../../../src/infrastructure/context/goals/reinstate/SqliteGoalReinstatedProjector";
import { HostBuilder } from "../../../../../src/infrastructure/host/HostBuilder";
import { MigrationRunner } from "../../../../../src/infrastructure/persistence/MigrationRunner";
import { getNamespaceMigrations } from "../../../../../src/infrastructure/persistence/migrations.config";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

describe("HostBuilder reinstate wiring", () => {
  let rootDir: string;
  let db: Database.Database;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-reinstate-host-"));
    db = new Database(":memory:");
    const infrastructureDir = path.resolve(currentDirectory, "../../../../../src/infrastructure");
    new MigrationRunner(db).runNamespaceMigrations(getNamespaceMigrations(infrastructureDir));
  });

  afterEach(async () => {
    db.close();
    await fs.remove(rootDir);
  });

  it("exposes the reinstate controller, event store, projector, and shared goal view reader", async () => {
    const container = await new HostBuilder(rootDir, db).build();

    expect(container.reinstateGoalController).toBeInstanceOf(ReinstateGoalController);
    expect(container.goalReinstatedEventStore).toBeInstanceOf(FsGoalReinstatedEventStore);
    expect(container.goalReinstatedProjector).toBeInstanceOf(SqliteGoalReinstatedProjector);
    expect(container.goalViewReader).toBeInstanceOf(SqliteGetGoalViewReader);
  });

  it("projects reinstatement through the live event-bus subscription", async () => {
    const container = await new HostBuilder(rootDir, db).build();
    const goal = Goal.create(GoalId.fromLegacy("goal_123"));
    const addedEvent = goal.add("Later work", "Return this goal to refinement", ["It is defined"]);
    const postponedEvent = goal.postpone();
    await container.goalAddedEventStore.append(addedEvent);
    await container.eventBus.publish(addedEvent);
    await container.goalPostponedEventStore.append(postponedEvent);
    await container.eventBus.publish(postponedEvent);

    await expect(container.reinstateGoalController.handle({ goalId: "goal_123" }))
      .resolves.toEqual({ status: GoalStatus.TODO });

    expect(db.prepare("SELECT status, version FROM goal_views WHERE goalId = ?").get("goal_123"))
      .toEqual({ status: GoalStatus.TODO, version: 3 });
  });
});
