import fs from "fs-extra";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { jest } from "@jest/globals";
import { Host } from "../../src/infrastructure/host/Host.js";
import type { HostBuilder } from "../../src/infrastructure/host/HostBuilder.js";
import { ProjectionBusFactory } from "../../src/infrastructure/messaging/ProjectionBusFactory.js";
import { MigrationRunner } from "../../src/infrastructure/persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../../src/infrastructure/persistence/migrations.config.js";
import { SqliteDecisionViewReader } from "../../src/infrastructure/context/decisions/get/SqliteDecisionViewReader.js";
import { SqliteRelationViewReader } from "../../src/infrastructure/context/relations/get/SqliteRelationViewReader.js";
import { SqliteSearchIndexStore } from "../../src/infrastructure/context/search/SqliteSearchIndexStore.js";
import { SqliteProjectStatsQuery } from "../../src/infrastructure/context/project/stats/SqliteProjectStatsQuery.js";
import { DecisionEventType, DecisionStatus } from "../../src/domain/decisions/Constants.js";
import { EntityType, RelationEventType, RelationStatus } from "../../src/domain/relations/Constants.js";
import { SearchCategory } from "../../src/application/context/search/SearchCategory.js";

jest.setTimeout(30_000);

describe("Decision removal integration", () => {
  let directory: string;
  let host: Host;
  let container: Awaited<ReturnType<HostBuilder["build"]>>;
  beforeEach(async () => {
    directory = await fs.mkdtemp(join(tmpdir(), "decision-removal-"));
    host = new Host(directory);
    container = await host.createBuilder().build();
  });
  afterEach(async () => { host.dispose(); await fs.remove(directory); });

  async function addDecision(title: string) {
    return (await container.addDecisionController.handle({ title, context: "Need durable architectural context" })).decisionId;
  }

  it("prunes active and deactivated relations in both directions, preserves history, and rebuilds without side effects", async () => {
    const decisionId = await addDecision("Removed choice");
    const source = { type: SearchCategory.DECISION, id: decisionId };
    expect(await container.searchIndexReader.findBySource(source)).not.toBeNull();
    const relationIds: string[] = [];
    const alreadyRemoved = new Map<string, Awaited<ReturnType<typeof container.relationRemovedEventStore.readStream>>>();
    for (const direction of ["incoming", "outgoing"] as const) {
      for (const status of [RelationStatus.ACTIVE, RelationStatus.DEACTIVATED, RelationStatus.REMOVED]) {
        const otherId = await addDecision(`${direction} ${status}`);
        const { relationId } = await container.addRelationController.handle({
          fromEntityType: EntityType.DECISION,
          fromEntityId: direction === "outgoing" ? decisionId : otherId,
          toEntityType: EntityType.DECISION,
          toEntityId: direction === "outgoing" ? otherId : decisionId,
          relationType: "informs",
          description: "Architectural context",
        });
        relationIds.push(relationId);
        if (status === RelationStatus.DEACTIVATED) {
          await container.reverseDecisionController.handle({ decisionId: otherId, reason: "No longer applicable" });
        }
        if (status === RelationStatus.REMOVED) {
          await container.removeRelationController.handle({ relationId });
          alreadyRemoved.set(relationId, await container.relationRemovedEventStore.readStream(relationId));
        }
      }
    }
    const unrelatedFrom = await addDecision("Unrelated source");
    const unrelatedTo = await addDecision("Unrelated target");
    const unrelated = await container.addRelationController.handle({ fromEntityType: EntityType.DECISION, fromEntityId: unrelatedFrom, toEntityType: EntityType.DECISION, toEntityId: unrelatedTo, relationType: "informs", description: "Unrelated context" });
    const before = await container.eventStore.getAllEvents();
    const [decisionBefore] = await container.decisionViewReader.findByIds([decisionId]);
    const statsBefore = (await container.projectStatsController.handle()).snapshot;
    expect(await container.removeDecisionCommandHandler.execute({ decisionId })).toEqual({ decisionId });
    const after = await container.eventStore.getAllEvents();
    expect(after).toHaveLength(before.length + 5); // One decision removal and four relation removals.
    expect((await container.decisionViewReader.findByIds([decisionId]))[0]).toMatchObject({ ...decisionBefore, status: DecisionStatus.REMOVED, version: decisionBefore.version + 1, updatedAt: expect.any(String) });
    const relations = await container.relationViewReader.findAll({ entityType: EntityType.DECISION, entityId: decisionId, status: "all" });
    expect(relations).toHaveLength(6);
    expect(relations.every(relation => relation.status === RelationStatus.REMOVED)).toBe(true);
    for (const relationId of relationIds) {
      const history = await container.relationRemovedEventStore.readStream(relationId);
      expect(history[0].type).toBe(RelationEventType.ADDED);
      expect(history.filter(event => event.type === RelationEventType.REMOVED)).toHaveLength(1);
      if (alreadyRemoved.has(relationId)) expect(history).toEqual(alreadyRemoved.get(relationId));
    }
    expect(await container.relationRemovedProjector.findById(unrelated.relationId)).toMatchObject({ status: RelationStatus.ACTIVE });
    expect(await container.searchIndexReader.findBySource(source)).toBeNull();
    expect(await container.searchIndexReader.search({ query: "Removed choice", category: SearchCategory.DECISION })).toEqual([]);
    expect((await container.projectStatsController.handle()).snapshot.memory.decisions.decisionsCount).toBe(statsBefore.memory.decisions.decisionsCount - 1);
    expect((await container.relationNodeCatalog.findAll()).find(node => node.entityId === decisionId)).toMatchObject({ lifecycleState: DecisionStatus.REMOVED, isCurrent: false });
    const history = await container.decisionRestoredEventStore.readStream(decisionId);
    expect(history.map(event => event.type)).toEqual([DecisionEventType.ADDED, DecisionEventType.REMOVED]);

    const rebuilt = new Database(":memory:");
    try {
      new MigrationRunner(rebuilt).runNamespaceMigrations(getNamespaceMigrations(resolve("src/infrastructure")));
      const bus = new ProjectionBusFactory().create(rebuilt);
      for (const event of after) await bus.publish(event);
      const order = <T extends { relationId: string }>(rows: T[]) => rows.sort((left, right) => left.relationId.localeCompare(right.relationId));
      expect(await new SqliteDecisionViewReader(rebuilt).findAll()).toEqual(await container.decisionViewReader.findAll());
      expect(order(await new SqliteRelationViewReader(rebuilt).findAll({ status: "all" }))).toEqual(order(await container.relationViewReader.findAll({ status: "all" })));
      expect(await new SqliteSearchIndexStore(rebuilt).findBySource(source)).toBeNull();
      expect(await new SqliteSearchIndexStore(rebuilt).search({ category: SearchCategory.DECISION })).toEqual(await container.searchIndexReader.search({ category: SearchCategory.DECISION }));
      expect((await new SqliteProjectStatsQuery(rebuilt).currentSnapshot()).memory.decisions).toEqual((await container.projectStatsController.handle()).snapshot.memory.decisions);
      expect(await container.eventStore.getAllEvents()).toEqual(after);
    } finally { rebuilt.close(); }
  });

  it.each([DecisionStatus.ACTIVE, DecisionStatus.REVERSED, DecisionStatus.SUPERSEDED])("removes %s decisions and persists no extra events for rejected transitions", async status => {
    const decisionId = await addDecision("Lifecycle choice");
    const otherId = await addDecision("Replacement choice");
    if (status === DecisionStatus.REVERSED) await container.reverseDecisionController.handle({ decisionId, reason: "Changed" });
    if (status === DecisionStatus.SUPERSEDED) await container.supersedeDecisionController.handle({ decisionId, supersededBy: otherId });
    const count = (await container.projectStatsController.handle()).snapshot.memory.decisions.decisionsCount;
    await container.removeDecisionCommandHandler.execute({ decisionId });
    const events = await container.eventStore.getAllEvents();
    expect((await container.projectStatsController.handle()).snapshot.memory.decisions.decisionsCount).toBe(count - (status === DecisionStatus.ACTIVE ? 1 : 0));
    await expect(container.removeDecisionCommandHandler.execute({ decisionId })).rejects.toThrow();
    await expect(container.removeDecisionCommandHandler.execute({ decisionId: "missing" })).rejects.toThrow();
    await expect(container.updateDecisionController.handle({ decisionId, title: "Changed" })).rejects.toThrow();
    await expect(container.reverseDecisionController.handle({ decisionId, reason: "Changed" })).rejects.toThrow();
    await expect(container.supersedeDecisionController.handle({ decisionId, supersededBy: otherId })).rejects.toThrow();
    await expect(container.restoreDecisionController.handle({ decisionId, reason: "Changed" })).rejects.toThrow();
    expect(await container.eventStore.getAllEvents()).toEqual(events);
    expect(await container.decisionViewReader.findAll(DecisionStatus.REMOVED)).toEqual([expect.objectContaining({ decisionId, status: DecisionStatus.REMOVED })]);
  });
});
