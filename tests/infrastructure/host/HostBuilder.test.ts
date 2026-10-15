import Database from "better-sqlite3";
import fs from "fs-extra";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AuditRelationsController } from "../../../src/application/context/relations/audit/AuditRelationsController.js";
import { ShowDecisionController } from "../../../src/application/context/decisions/show/ShowDecisionController.js";
import { RemoveDecisionController } from "../../../src/application/context/decisions/remove/RemoveDecisionController.js";
import { DecisionStatus } from "../../../src/domain/decisions/Constants.js";
import { HostBuilder } from "../../../src/infrastructure/host/HostBuilder.js";
import { SqliteRelationNodeCatalog } from "../../../src/infrastructure/context/relations/audit/SqliteRelationNodeCatalog.js";
import { MigrationRunner } from "../../../src/infrastructure/persistence/MigrationRunner.js";
import { getNamespaceMigrations } from "../../../src/infrastructure/persistence/migrations.config.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

describe("HostBuilder relation audit wiring", () => {
  let tempDirectory: string;
  let db: Database.Database;

  beforeEach(async () => {
    tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-host-builder-audit-"));
    db = new Database(":memory:");
    const infrastructureDirectory = path.resolve(currentDirectory, "../../../src/infrastructure");
    jest.spyOn(console, "error").mockImplementation(() => {});
    new MigrationRunner(db).runNamespaceMigrations(getNamespaceMigrations(infrastructureDirectory));
  });

  afterEach(async () => {
    db.close();
    await fs.remove(tempDirectory);
    jest.restoreAllMocks();
  });

  it("exposes the node catalog and a usable read-only audit controller", async () => {
    const container = await new HostBuilder(tempDirectory, db).build();

    expect(container.relationNodeCatalog).toBeInstanceOf(SqliteRelationNodeCatalog);
    expect(container.auditRelationsController).toBeInstanceOf(AuditRelationsController);
    await expect(container.auditRelationsController.handle({ checks: ["summary"] })).resolves.toEqual(
      expect.objectContaining({
        requestedChecks: ["summary"],
        summary: expect.objectContaining({
          nodes: { count: 0, byEntityType: {} },
          relations: expect.objectContaining({ count: 0 }),
        }),
      }),
    );
  });

  it("wires decision removal through the controller, gateway, and backend handler", async () => {
    const container = await new HostBuilder(tempDirectory, db).build();
    expect(container.removeDecisionController).toBeInstanceOf(RemoveDecisionController);
    const { decisionId } = await container.addDecisionController.handle({
      title: "Wiring choice", context: "Verify local removal composition",
    });
    await expect(container.removeDecisionController.handle({ decisionId })).resolves.toEqual({
      decisionId, status: DecisionStatus.REMOVED,
    });
    expect((await container.decisionViewReader.findByIds([decisionId]))[0].status).toBe(DecisionStatus.REMOVED);
    await expect(container.removeDecisionController.handle({ decisionId })).rejects.toThrow();
  });

  it("exposes a usable decision-show controller backed by the decision view reader", async () => {
    const container = await new HostBuilder(tempDirectory, db).build();

    expect(container.showDecisionController).toBeInstanceOf(ShowDecisionController);
    await expect(container.showDecisionController.handle({ decisionId: "dec_missing" }))
      .rejects.toThrow("Decision not found: dec_missing");
  });
});
