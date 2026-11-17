import { describe, expect, it, jest } from "@jest/globals";
import Database from "better-sqlite3";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { IEventStore } from "../../../../../src/application/persistence/IEventStore.js";
import { ComponentEventType, ComponentStatus, ComponentType } from "../../../../../src/domain/components/Constants.js";
import { InvariantEventType } from "../../../../../src/domain/invariants/Constants.js";
import { LocalSearchIndexRebuildGateway } from "../../../../../src/infrastructure/context/search/LocalSearchIndexRebuildGateway.js";
import { SqliteSearchIndexStore } from "../../../../../src/infrastructure/context/search/SqliteSearchIndexStore.js";

describe("LocalSearchIndexRebuildGateway infrastructure", () => {
  it("clears only search_index_entries and rebuilds category counts from persisted events", async () => {
    const db = createDb();
    seedSearchEntry(db, SearchCategory.DECISION, "dec-old", "Old decision");
    db.prepare("INSERT INTO unrelated_projection (id, value) VALUES (?, ?)").run("keep", "unchanged");
    const store = new SqliteSearchIndexStore(db);
    const eventStore = createEventStore([
      {
        type: "SessionStartedEvent",
        aggregateId: "session-1",
        version: 1,
        timestamp: "2026-01-01T00:00:00.000Z",
        payload: {},
      },
      {
        type: ComponentEventType.ADDED,
        aggregateId: "comp-1",
        version: 1,
        timestamp: "2026-01-01T00:00:01.000Z",
        payload: {
          name: "ProjectedSearchIndex",
          type: ComponentType.SERVICE,
          description: "Indexes memory documents",
          responsibility: "Search rebuild",
          path: "src/application/context/search",
          status: ComponentStatus.ACTIVE,
        },
      },
      {
        type: InvariantEventType.ADDED,
        aggregateId: "inv-legacy",
        version: 1,
        timestamp: "2026-01-01T00:00:02.000Z",
        payload: {
          category: "architecture",
          description: "Legacy invariant shape still becomes searchable",
        },
      },
    ]);
    const gateway = new LocalSearchIndexRebuildGateway(eventStore, store, store, store);

    const response = await gateway.rebuildSearchIndex({});

    expect(response).toEqual({
      success: true,
      eventsInspected: 3,
      documentsIndexed: 2,
      removedEntries: 1,
      countsByCategory: {
        [SearchCategory.COMPONENT]: 1,
        [SearchCategory.INVARIANT]: 1,
      },
    });
    expect(db.prepare("SELECT COUNT(*) AS count FROM unrelated_projection").get()).toEqual({ count: 1 });
    const invariant = await store.findBySource({ type: SearchCategory.INVARIANT, id: "inv-legacy" });
    expect(invariant).toMatchObject({
      title: "architecture",
      category: SearchCategory.INVARIANT,
      summary: "Legacy invariant shape still becomes searchable",
    });
  });

  it("reports an empty rebuild without failing", async () => {
    const db = createDb();
    const store = new SqliteSearchIndexStore(db);
    const gateway = new LocalSearchIndexRebuildGateway(createEventStore([]), store, store, store);

    await expect(gateway.rebuildSearchIndex({})).resolves.toEqual({
      success: true,
      eventsInspected: 0,
      documentsIndexed: 0,
      removedEntries: 0,
      countsByCategory: {},
    });
  });

  it("does not clear the index when persisted events cannot be loaded", async () => {
    const db = createDb();
    seedSearchEntry(db, SearchCategory.COMPONENT, "comp-existing", "Existing component");
    const store = new SqliteSearchIndexStore(db);
    const eventStore: jest.Mocked<IEventStore> = {
      append: jest.fn<IEventStore["append"]>(),
      readStream: jest.fn<IEventStore["readStream"]>(),
      getAllEvents: jest.fn<IEventStore["getAllEvents"]>().mockRejectedValue(new Error("event store unavailable")),
    };
    const gateway = new LocalSearchIndexRebuildGateway(eventStore, store, store, store);

    await expect(gateway.rebuildSearchIndex({})).rejects.toThrow("event store unavailable");

    await expect(store.findBySource({ type: SearchCategory.COMPONENT, id: "comp-existing" })).resolves.toMatchObject({
      title: "Existing component",
    });
  });
});

function createEventStore(events: Awaited<ReturnType<IEventStore["getAllEvents"]>>): jest.Mocked<IEventStore> {
  return {
    append: jest.fn<IEventStore["append"]>(),
    readStream: jest.fn<IEventStore["readStream"]>(),
    getAllEvents: jest.fn<IEventStore["getAllEvents"]>().mockResolvedValue(events),
  };
}

function createDb(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE search_index_entries (
      sourceType TEXT NOT NULL,
      sourceId TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      facets TEXT NOT NULL,
      metadata TEXT NOT NULL,
      version INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (sourceType, sourceId)
    );

    CREATE TABLE unrelated_projection (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

function seedSearchEntry(db: Database.Database, category: SearchCategory, id: string, title: string): void {
  db.prepare(`
    INSERT INTO search_index_entries (
      sourceType, sourceId, category, title, summary, content,
      facets, metadata, version, createdAt, updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category,
    id,
    category,
    title,
    null,
    title,
    "{}",
    "{}",
    1,
    "2026-01-01T00:00:00.000Z",
    "2026-01-01T00:00:00.000Z"
  );
}
