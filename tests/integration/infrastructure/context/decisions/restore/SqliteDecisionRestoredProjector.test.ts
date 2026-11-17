import Database from "better-sqlite3";
import { SqliteDecisionRestoredProjector } from "../../../../../../src/infrastructure/context/decisions/restore/SqliteDecisionRestoredProjector.js";
import { DecisionRestoredEvent } from "../../../../../../src/domain/decisions/restore/DecisionRestoredEvent.js";
import { DecisionEventType } from "../../../../../../src/domain/decisions/Constants.js";

describe("SqliteDecisionRestoredProjector", () => {
  let db: Database.Database;
  let projector: SqliteDecisionRestoredProjector;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE decision_views (
        decisionId TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        context TEXT NOT NULL,
        rationale TEXT,
        alternatives TEXT NOT NULL,
        consequences TEXT,
        status TEXT NOT NULL,
        supersededBy TEXT,
        reversalReason TEXT,
        reversedAt TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    db.prepare(`
      INSERT INTO decision_views (
        decisionId, title, context, rationale, alternatives, consequences,
        status, supersededBy, reversalReason, reversedAt, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "dec_123",
      "Use SQLite",
      "Need local db",
      null,
      "[]",
      null,
      "reversed",
      null,
      "No longer needed",
      "2026-03-01T00:00:00.000Z",
      2,
      "2026-03-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z"
    );

    projector = new SqliteDecisionRestoredProjector(db);
  });

  afterEach(() => {
    db.close();
  });

  it("sets status to active and clears terminal fields", async () => {
    const event: DecisionRestoredEvent = {
      type: DecisionEventType.RESTORED,
      aggregateId: "dec_123",
      version: 3,
      timestamp: "2026-03-02T00:00:00.000Z",
      payload: {
        reason: "Still valid",
        restoredAt: "2026-03-02T00:00:00.000Z",
      },
    };

    await projector.applyDecisionRestored(event);

    const row = db.prepare("SELECT status, supersededBy, reversalReason, reversedAt, version FROM decision_views WHERE decisionId = ?").get("dec_123") as { status: string; supersededBy: string | null; reversalReason: string | null; reversedAt: string | null; version: number };
    expect(row.status).toBe("active");
    expect(row.supersededBy).toBeNull();
    expect(row.reversalReason).toBeNull();
    expect(row.reversedAt).toBeNull();
    expect(row.version).toBe(3);
  });
});
