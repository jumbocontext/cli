import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { SqliteRelationViewReader } from "../../../../../../src/infrastructure/context/relations/get/SqliteRelationViewReader.js";

describe("SqliteRelationViewReader", () => {
  let db: Database.Database;
  let reader: SqliteRelationViewReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE relation_views (
        relationId TEXT PRIMARY KEY,
        fromEntityType TEXT NOT NULL,
        fromEntityId TEXT NOT NULL,
        toEntityType TEXT NOT NULL,
        toEntityId TEXT NOT NULL,
        relationType TEXT NOT NULL,
        strength TEXT,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    reader = new SqliteRelationViewReader(db);
  });

  afterEach(() => db.close());

  function insert(
    relationId: string,
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    relationType: string,
    strength: string | null,
    status: string,
    createdAt: string
  ): void {
    db.prepare(`
      INSERT INTO relation_views (
        relationId, fromEntityType, fromEntityId, toEntityType, toEntityId,
        relationType, strength, description, status, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      relationId, fromType, fromId, toType, toId,
      relationType, strength, relationId, status, createdAt, createdAt
    );
  }

  it("queries incoming, outgoing, and both directions relative to a typed reference", async () => {
    insert("rel_out", "goal", "root", "component", "c1", "involves", "strong", "active", "2026-01-01");
    insert("rel_in", "decision", "d1", "goal", "root", "supports", "weak", "active", "2026-01-02");
    insert("rel_other", "goal", "other", "component", "c2", "involves", "strong", "active", "2026-01-03");

    await expect(reader.findAll({ entity: { entityType: "goal", entityId: "root" }, direction: "out" }))
      .resolves.toEqual([expect.objectContaining({ relationId: "rel_out" })]);
    await expect(reader.findAll({ entityType: "goal", entityId: "root", direction: "in" }))
      .resolves.toEqual([expect.objectContaining({ relationId: "rel_in" })]);
    expect((await reader.findAll({ entityType: "goal", entityId: "root", direction: "both" }))
      .map((edge) => edge.relationId)).toEqual(["rel_out", "rel_in"]);
  });

  it("combines relation, related entity, strength, and status filters", async () => {
    insert("match", "goal", "root", "component", "c1", "requires", "strong", "deactivated", "2026-01-01");
    insert("wrong-type", "goal", "root", "decision", "d1", "requires", "strong", "deactivated", "2026-01-02");
    insert("wrong-relation", "goal", "root", "component", "c2", "involves", "strong", "deactivated", "2026-01-03");
    insert("wrong-strength", "goal", "root", "component", "c3", "requires", "weak", "deactivated", "2026-01-04");
    insert("wrong-status", "goal", "root", "component", "c4", "requires", "strong", "active", "2026-01-05");

    const result = await reader.findAll({
      entityType: "goal",
      entityId: "root",
      direction: "out",
      relatedEntityType: "component",
      relationType: "requires",
      strength: "strong",
      status: "deactivated",
    });

    expect(result.map((edge) => edge.relationId)).toEqual(["match"]);
  });

  it("defaults to active status and permits all statuses explicitly", async () => {
    insert("active", "goal", "root", "component", "c1", "involves", null, "active", "2026-01-01");
    insert("removed", "goal", "root", "component", "c2", "involves", null, "removed", "2026-01-02");

    expect((await reader.findAll()).map((edge) => edge.relationId)).toEqual(["active"]);
    expect((await reader.findAll({ status: "all" })).map((edge) => edge.relationId))
      .toEqual(["active", "removed"]);
  });

  it("uses relation ID as a stable tie-breaker", async () => {
    insert("rel_b", "goal", "root", "component", "b", "involves", null, "active", "same");
    insert("rel_a", "goal", "root", "component", "a", "involves", null, "active", "same");

    expect((await reader.findAll()).map((edge) => edge.relationId)).toEqual(["rel_a", "rel_b"]);
  });

  it("resolves distinct endpoint types without applying relation status", async () => {
    insert("rel_1", "goal", "shared", "component", "c1", "involves", null, "removed", "2026-01-01");
    insert("rel_2", "decision", "shared", "component", "c2", "involves", null, "active", "2026-01-02");
    insert("rel_3", "goal", "g1", "component", "shared", "involves", null, "active", "2026-01-03");

    await expect(reader.findEndpointTypes("shared"))
      .resolves.toEqual(["component", "decision", "goal"]);
  });

  it("retains original edge orientation and description for incoming path expansion", async () => {
    insert("rel_in", "goal", "goal_1", "component", "component_1", "involves", "strong", "active", "2026-01-01");

    const result = await reader.findAll({
      entity: { entityType: "component", entityId: "component_1" },
      direction: "in",
    });

    expect(result).toEqual([expect.objectContaining({
      relationId: "rel_in",
      fromEntityType: "goal",
      fromEntityId: "goal_1",
      toEntityType: "component",
      toEntityId: "component_1",
      description: "rel_in",
    })]);
  });
});
