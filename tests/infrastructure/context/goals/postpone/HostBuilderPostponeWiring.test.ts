import Database from "better-sqlite3";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostponeGoalController } from "../../../../../src/application/context/goals/postpone/PostponeGoalController";
import { SqliteGetGoalViewReader } from "../../../../../src/infrastructure/context/goals/get/SqliteGetGoalViewReader";
import { FsGoalPostponedEventStore } from "../../../../../src/infrastructure/context/goals/postpone/FsGoalPostponedEventStore";
import { SqliteGoalPostponedProjector } from "../../../../../src/infrastructure/context/goals/postpone/SqliteGoalPostponedProjector";
import { HostBuilder } from "../../../../../src/infrastructure/host/HostBuilder";
import { MigrationRunner } from "../../../../../src/infrastructure/persistence/MigrationRunner";
import { getNamespaceMigrations } from "../../../../../src/infrastructure/persistence/migrations.config";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

describe("HostBuilder postpone wiring", () => {
  let rootDir: string;
  let db: Database.Database;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-postpone-host-"));
    db = new Database(":memory:");
    const infrastructureDir = path.resolve(currentDirectory, "../../../../../src/infrastructure");
    new MigrationRunner(db).runNamespaceMigrations(getNamespaceMigrations(infrastructureDir));
  });

  afterEach(async () => {
    db.close();
    await fs.remove(rootDir);
  });

  it("exposes the postpone controller, event store, projector, and goal view reader", async () => {
    const container = await new HostBuilder(rootDir, db).build();

    expect(container.postponeGoalController).toBeInstanceOf(PostponeGoalController);
    expect(container.goalPostponedEventStore).toBeInstanceOf(FsGoalPostponedEventStore);
    expect(container.goalPostponedProjector).toBeInstanceOf(SqliteGoalPostponedProjector);
    expect(container.goalViewReader).toBeInstanceOf(SqliteGetGoalViewReader);
  });
});
