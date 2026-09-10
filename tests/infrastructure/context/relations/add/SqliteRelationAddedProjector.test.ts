import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { Relation } from "../../../../../src/domain/relations/Relation.js";
import { SqliteRelationAddedProjector } from "../../../../../src/infrastructure/context/relations/add/SqliteRelationAddedProjector.js";
import { SqliteRelationRemovedProjector } from "../../../../../src/infrastructure/context/relations/remove/SqliteRelationRemovedProjector.js";
import { SqliteRelationDeactivatedProjector } from "../../../../../src/infrastructure/context/relations/deactivate/SqliteRelationDeactivatedProjector.js";

describe("SqliteRelationAddedProjector", () => {
  let db: Database.Database;
  let projector: SqliteRelationAddedProjector;
  const migrate = () => db.exec(readFileSync("src/infrastructure/context/relations/migrations/002-unique-non-removed-relations.sql", "utf8"));
  const create = () => {
    const relation = Relation.create();
    const event = relation.add("goal", "same-id", "component", "same-id", "involves", "Guidance", "strong");
    return { relation, event };
  };
  const find = () => projector.findByEntities("goal", "same-id", "component", "same-id", "involves");
  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(readFileSync("src/infrastructure/context/relations/migrations/001-create-relation-views.sql", "utf8"));
    projector = new SqliteRelationAddedProjector(db);
  });
  afterEach(() => db.close());

  it("excludes removed relations while retaining typed identity and deactivated matches", async () => {
    migrate();
    const { relation, event } = create();
    await projector.applyRelationAdded(event);
    expect(await find()).toMatchObject({ relationId: event.aggregateId, status: "active" });
    expect(await projector.findByEntities("component", "same-id", "goal", "same-id", "involves")).toBeNull();
    expect(await projector.findByEntities("goal", "same-id", "component", "same-id", "uses")).toBeNull();
    await new SqliteRelationDeactivatedProjector(db).applyRelationDeactivated(relation.deactivate("Endpoint inactive"));
    expect(await find()).toMatchObject({ relationId: event.aggregateId, status: "deactivated" });
    await new SqliteRelationRemovedProjector(db).applyRelationRemoved(relation.remove());
    expect(await find()).toBeNull();
  });

  it.each(["active", "deactivated", "removed"] as const)("migrates existing %s rows without modifying them", async status => {
    const { relation, event } = create();
    await projector.applyRelationAdded(event);
    if (status === "deactivated") await new SqliteRelationDeactivatedProjector(db).applyRelationDeactivated(relation.deactivate("Paused"));
    if (status === "removed") await new SqliteRelationRemovedProjector(db).applyRelationRemoved(relation.remove());
    const before = db.prepare("SELECT * FROM relation_views").all();
    migrate();
    expect(db.prepare("SELECT * FROM relation_views").all()).toEqual(before);
    const next = create();
    if (status === "removed") {
      await projector.applyRelationAdded(next.event);
      expect(await find()).toMatchObject({ relationId: next.event.aggregateId });
      expect(db.prepare("SELECT * FROM relation_views WHERE relationId = ?").get(event.aggregateId)).toEqual(before[0]);
    } else {
      await expect(projector.applyRelationAdded(next.event)).rejects.toMatchObject({ code: "SQLITE_CONSTRAINT_UNIQUE" });
      expect(db.prepare("SELECT * FROM relation_views").all()).toEqual(before);
    }
  });

  it("preserves multiple removed connections alongside one current connection", async () => {
    migrate();
    for (let index = 0; index < 3; index++) {
      const { relation, event } = create();
      await projector.applyRelationAdded(event);
      await new SqliteRelationRemovedProjector(db).applyRelationRemoved(relation.remove());
    }
    const current = create();
    await projector.applyRelationAdded(current.event);
    expect(await find()).toMatchObject({ relationId: current.event.aggregateId });
    await expect(projector.applyRelationAdded(create().event)).rejects.toMatchObject({ code: "SQLITE_CONSTRAINT_UNIQUE" });
    expect(db.prepare("SELECT COUNT(*) AS count FROM relation_views").get()).toEqual({ count: 4 });
  });

  it("replaying an add cannot overwrite its removed row or replace a newer relation", async () => {
    migrate();
    const old = create();
    await projector.applyRelationAdded(old.event);
    await new SqliteRelationRemovedProjector(db).applyRelationRemoved(old.relation.remove());
    const current = create();
    await projector.applyRelationAdded(current.event);
    const before = db.prepare("SELECT * FROM relation_views ORDER BY relationId").all();
    await projector.applyRelationAdded(old.event);
    await projector.applyRelationAdded(current.event);
    expect(db.prepare("SELECT * FROM relation_views ORDER BY relationId").all()).toEqual(before);
  });
});
