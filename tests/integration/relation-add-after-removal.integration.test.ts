import fs from "fs-extra";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { Host } from "../../src/infrastructure/host/Host.js";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { ProjectionBusFactory } from "../../src/infrastructure/messaging/ProjectionBusFactory.js";
import { SqliteRelationViewReader } from "../../src/infrastructure/context/relations/get/SqliteRelationViewReader.js";
import { RelationEventType } from "../../src/domain/relations/Constants.js";
import { jest } from "@jest/globals";

jest.setTimeout(30_000);

describe("Adding a relation after removal", () => {
  let directory: string;
  let host: Host;
  let container: IApplicationContainer;
  beforeEach(async () => {
    directory = await fs.mkdtemp(join(tmpdir(), "relation-add-after-removal-"));
    host = new Host(join(directory, ".jumbo"));
    container = await host.createBuilder().build();
  });
  afterEach(async () => {
    host.dispose();
    await fs.remove(directory);
  });
  async function endpoints() {
    const { goalId } = await container.addGoalController.handle({ title: "Repair context", objective: "Use current guidance", successCriteria: ["Current guidance connected"] });
    const { invariantId } = await container.addInvariantController.handle({ title: "Boundary", description: "Respect the application boundary" });
    return { fromEntityType: "goal" as const, fromEntityId: goalId, toEntityType: "invariant" as const, toEntityId: invariantId, relationType: "must-respect", description: "Original guidance", strength: "strong" as const };
  }

  it("creates a new identity and scoped guidance while preserving history through replay", async () => {
    const request = await endpoints();
    const original = await container.addRelationController.handle(request);
    const obsolete = await container.addRelationController.handle({ ...request, relationType: "constrained-by", description: "Superseded broad constraint" });
    await container.removeRelationController.handle(obsolete);
    await container.removeRelationController.handle(original);
    const originalHistory = await container.relationRemovedEventStore.readStream(original.relationId);
    const originalView = await container.relationRemovedProjector.findById(original.relationId);
    const revised = { ...request, description: "Respect this boundary only for relation add", strength: undefined };
    const current = await container.addRelationController.handle(revised);
    expect(current.relationId).not.toBe(original.relationId);
    expect(current).toEqual({ relationId: expect.any(String) });
    expect(await container.relationAddedProjector.findByEntities(request.fromEntityType, request.fromEntityId, request.toEntityType, request.toEntityId, request.relationType)).toMatchObject({ relationId: current.relationId, description: revised.description, status: "active", version: 1, strength: null });
    expect(await container.addRelationController.handle(revised)).toEqual(current);
    expect(await container.relationRemovedProjector.findById(original.relationId)).toEqual(originalView);
    expect(await container.relationRemovedEventStore.readStream(original.relationId)).toEqual(originalHistory);
    const currentHistory = await container.relationRemovedEventStore.readStream(current.relationId);
    expect(originalHistory.map(event => event.type)).toEqual([RelationEventType.ADDED, RelationEventType.REMOVED]);
    expect(currentHistory.map(event => event.type)).toEqual([RelationEventType.ADDED]);
    const context = await container.goalContextAssembler.assembleContextForGoal(request.fromEntityId);
    expect(context?.context.invariants).toEqual([
      expect.objectContaining({ relationType: "must-respect", relationDescription: revised.description, entity: expect.objectContaining({ invariantId: request.toEntityId }) }),
    ]);
    const rebuilt = new Database(":memory:");
    try {
      for (const migration of ["001-create-relation-views.sql", "002-unique-non-removed-relations.sql"]) {
        rebuilt.exec(await fs.readFile(join("src/infrastructure/context/relations/migrations", migration), "utf8"));
      }
      const bus = new ProjectionBusFactory().create(rebuilt);
      const obsoleteHistory = await container.relationRemovedEventStore.readStream(obsolete.relationId);
      for (const event of [...originalHistory, ...obsoleteHistory, ...currentHistory]) await bus.publish(event);
      const order = <T extends { relationId: string }>(rows: T[]) => rows.sort((left, right) => left.relationId.localeCompare(right.relationId));
      expect(order(await new SqliteRelationViewReader(rebuilt).findAll({ status: "all" }))).toEqual(order(await container.relationViewReader.findAll({ status: "all" })));
      expect(await container.relationRemovedEventStore.readStream(original.relationId)).toEqual(originalHistory);
      expect(await container.relationRemovedEventStore.readStream(current.relationId)).toEqual(currentHistory);
    } finally { rebuilt.close(); }
  });

  it("preserves duplicate behavior and creates new identities on repeated removal", async () => {
    const request = await endpoints();
    const ids = new Set<string>();
    for (let index = 0; index < 3; index++) {
      const added = await container.addRelationController.handle(request);
      expect(ids.has(added.relationId)).toBe(false);
      ids.add(added.relationId);
      expect(await container.addRelationController.handle({ ...request, description: "Existing duplicate behavior" })).toEqual(added);
      await container.removeRelationController.handle(added);
    }
    expect(await container.relationViewReader.findAll({ status: "all" })).toHaveLength(3);
    expect(await container.relationViewReader.findAll({ status: "active" })).toHaveLength(0);
  });

  it.each(["text", "json"] as const)("compiled CLI creates a new connection with unchanged %s output", async format => {
    const request = await endpoints();
    const original = await container.addRelationController.handle(request);
    await container.removeRelationController.handle(original);
    const result = spawnSync(process.execPath, [resolve("dist/cli.js"), "relation", "add", "--from-type", "goal", "--from-id", request.fromEntityId, "--to-type", "invariant", "--to-id", request.toEntityId, "--type", request.relationType, "--description", "New guidance", "--format", format], {
      cwd: directory, encoding: "utf8", env: { ...process.env, JUMBO_TELEMETRY_DISABLED: "1" },
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const current = await container.relationAddedProjector.findByEntities("goal", request.fromEntityId, "invariant", request.toEntityId, request.relationType);
    expect(current).toMatchObject({ status: "active", description: "New guidance", strength: null, version: 1 });
    expect(current!.relationId).not.toBe(original.relationId);
    if (format === "json") {
      expect(JSON.parse(result.stdout)).toEqual({ relationId: current!.relationId, from: `goal:${request.fromEntityId}`, to: `invariant:${request.toEntityId}`, relationType: request.relationType });
    } else {
      expect(result.stdout).toContain("Relation added successfully");
      expect(result.stdout).toContain(current!.relationId);
    }
  });
});
