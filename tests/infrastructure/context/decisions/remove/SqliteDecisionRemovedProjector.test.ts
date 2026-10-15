import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { SqliteDecisionRemovedProjector } from "../../../../../src/infrastructure/context/decisions/remove/SqliteDecisionRemovedProjector.js";
import { SqliteDecisionAddedProjector } from "../../../../../src/infrastructure/context/decisions/add/SqliteDecisionAddedProjector.js";
import { SqliteDecisionViewReader } from "../../../../../src/infrastructure/context/decisions/get/SqliteDecisionViewReader.js";
import { Decision } from "../../../../../src/domain/decisions/Decision.js";
import { DecisionStatus } from "../../../../../src/domain/decisions/Constants.js";

describe("SqliteDecisionRemovedProjector", () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(readFileSync("src/infrastructure/context/decisions/migrations/001-create-decision-views.sql", "utf8"));
  });
  afterEach(() => { db.close(); });

  it("retains content and creation metadata while projecting removal status, version and timestamp", async () => {
    const decision = Decision.create();
    const added = decision.add("Use SQLite", "Need local storage", "Offline", ["Remote DB"], "Portable");
    await new SqliteDecisionAddedProjector(db).applyDecisionAdded(added);
    const reader = new SqliteDecisionViewReader(db);
    const [before] = await reader.findByIds([added.aggregateId]);
    const event = { ...decision.remove(), timestamp: "2026-12-01T00:00:00.000Z" };
    const projector = new SqliteDecisionRemovedProjector(db);
    await projector.applyDecisionRemoved(event);
    const expected = { ...before, status: DecisionStatus.REMOVED, version: event.version, updatedAt: event.timestamp };
    expect(await reader.findByIds([added.aggregateId])).toEqual([expected]);
    await projector.applyDecisionRemoved(event);
    expect(await reader.findAll()).toEqual([expected]);
  });
});
