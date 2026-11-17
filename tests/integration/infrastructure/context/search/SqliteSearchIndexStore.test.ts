import { describe, expect, it } from "@jest/globals";
import Database from "better-sqlite3";
import { SearchCategory } from "../../../../../src/application/context/search/SearchCategory.js";
import { SqliteSearchIndexStore } from "../../../../../src/infrastructure/context/search/SqliteSearchIndexStore.js";
import { ComponentStatus } from "../../../../../src/domain/components/Constants.js";
import { DecisionStatus } from "../../../../../src/domain/decisions/Constants.js";

describe("SqliteSearchIndexStore", () => {
  it("upserts documents and searches the projected index", async () => {
    const db = createDb();
    const store = new SqliteSearchIndexStore(db);

    await store.upsert({
      source: { type: SearchCategory.COMPONENT, id: "comp-1" },
      category: SearchCategory.COMPONENT,
      title: "SearchIndex",
      summary: "Projects searchable memory",
      content: "SearchIndex\nProjects searchable memory\nSQLite projection",
      facets: { status: ComponentStatus.ACTIVE },
      metadata: { path: "src/search" },
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const hits = await store.search({ query: "sqlite", groupByCategory: true });

    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      source: { type: SearchCategory.COMPONENT, id: "comp-1" },
      category: SearchCategory.COMPONENT,
      title: "SearchIndex",
      facets: { status: ComponentStatus.ACTIVE },
    });
    expect(hits[0].snippet).toContain("SQLite projection");
    expect((hits[0] as unknown as { content?: unknown }).content).toBeUndefined();
  });

  it("finds current documents by source for partial event projection", async () => {
    const db = createDb();
    const store = new SqliteSearchIndexStore(db);

    await store.upsert({
      source: { type: SearchCategory.DECISION, id: "dec-1" },
      category: SearchCategory.DECISION,
      title: "Use projected search",
      summary: "Avoid scanning source read models",
      content: "Use projected search\nAvoid scanning source read models",
      facets: { status: DecisionStatus.ACTIVE },
      metadata: { status: DecisionStatus.ACTIVE },
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const document = await store.findBySource({ type: SearchCategory.DECISION, id: "dec-1" });

    expect(document?.metadata).toEqual({ status: DecisionStatus.ACTIVE });
    expect(document?.content).toContain("Avoid scanning");
  });

  it("filters search hits by category", async () => {
    const db = createDb();
    const store = new SqliteSearchIndexStore(db);

    await store.upsert(createDocument(SearchCategory.COMPONENT, "comp-1", "Search component"));
    await store.upsert(createDocument(SearchCategory.DECISION, "dec-1", "Search decision"));

    const hits = await store.search({ query: "search", category: SearchCategory.DECISION });

    expect(hits).toHaveLength(1);
    expect(hits[0].source).toEqual({ type: SearchCategory.DECISION, id: "dec-1" });
  });

  it("returns empty search results when the projected index has no matches", async () => {
    const db = createDb();
    const store = new SqliteSearchIndexStore(db);

    await store.upsert(createDocument(SearchCategory.COMPONENT, "comp-1", "Search component"));

    await expect(store.search({ query: "missing" })).resolves.toEqual([]);
  });
});

function createDocument(category: SearchCategory, id: string, title: string) {
  return {
    source: { type: category, id },
    category,
    title,
    summary: null,
    content: title,
    facets: {},
    metadata: {},
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
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
  `);
  return db;
}
