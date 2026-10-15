import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import fs from "fs-extra";
import { Host } from "../../src/infrastructure/host/Host.js";
import { DecisionEventType, DecisionStatus } from "../../src/domain/decisions/Constants.js";
import { EntityType, RelationStatus } from "../../src/domain/relations/Constants.js";

const cliPath = resolve("dist/cli.js");

describe("compiled decision remove CLI (run npm run build first)", () => {
  let directory: string;
  let project: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(join(tmpdir(), "jumbo-decision-remove-cli-"));
    project = join(directory, "project");
    await fs.ensureDir(project);
    expect(await fs.pathExists(cliPath)).toBe(true);
    const initialized = run("project", "init", "--non-interactive", "--yolo", "--name", "Removal smoke", "--purpose", "CLI verification");
    expect({ status: initialized.status, error: initialized.status ? initialized.stderr : undefined }).toEqual({ status: 0 });
  });

  afterEach(async () => { await fs.remove(directory); });

  function run(...args: string[]) {
    return spawnSync(process.execPath, [cliPath, ...args], {
      cwd: project, encoding: "utf8", timeout: 20_000,
      env: { ...process.env, JUMBO_TELEMETRY_DISABLED: "1", JUMBO_FORMAT: "", NO_COLOR: "1" },
    });
  }

  async function inspect() {
    const host = new Host(join(project, ".jumbo"));
    try {
      const container = await host.createBuilder().build();
      return {
        events: (await container.eventStore.getAllEvents()).filter(event => event.type !== "WorkerIdentifiedEvent"),
        decisions: await container.decisionViewReader.findAll(),
        relations: await container.relationViewReader.findAll({ status: "all" }),
      };
    } finally { host.dispose(); }
  }

  it("removes a decision, prunes both directions and inactive relations, and preserves event history", async () => {
    const host = new Host(join(project, ".jumbo"));
    let decisionId: string;
    const relationIds: string[] = [];
    try {
      const container = await host.createBuilder().build();
      decisionId = (await container.addDecisionController.handle({ title: "Target", context: "Removal smoke" })).decisionId;
      for (const incoming of [true, false]) {
        for (const deactivate of [true, false]) {
          const otherId = (await container.addDecisionController.handle({ title: "Related", context: "Removal smoke" })).decisionId;
          const { relationId } = await container.addRelationController.handle({
            fromEntityType: EntityType.DECISION,
            fromEntityId: incoming ? otherId : decisionId,
            toEntityType: EntityType.DECISION,
            toEntityId: incoming ? decisionId : otherId,
            relationType: "informs", description: "Removal smoke",
          });
          relationIds.push(relationId);
          if (deactivate) await container.reverseDecisionController.handle({ decisionId: otherId, reason: "Changed" });
        }
      }
    } finally { host.dispose(); }
    const before = await inspect();
    const result = run("decision", "remove", "--id", decisionId);
    expect({ status: result.status, stdout: result.status ? result.stdout : undefined, stderr: result.status ? result.stderr : undefined }).toEqual({ status: 0 });
    expect(JSON.parse(result.stdout)).toEqual({ decisionId, status: DecisionStatus.REMOVED });
    const after = await inspect();
    expect(after.decisions.find(decision => decision.decisionId === decisionId)?.status).toBe(DecisionStatus.REMOVED);
    expect(after.events.slice(0, before.events.length)).toEqual(before.events);
    expect(after.events).toHaveLength(before.events.length + 5);
    expect(after.events.filter(event => event.aggregateId === decisionId).map(event => event.type)).toEqual([
      DecisionEventType.ADDED, DecisionEventType.REMOVED,
    ]);
    expect(after.relations.filter(relation => relationIds.includes(relation.relationId))).toHaveLength(4);
    expect(after.relations.every(relation => relation.status === RelationStatus.REMOVED)).toBe(true);

    for (const id of [decisionId, "missing"]) {
      const failure = run("decision", "remove", "--id", id, "--format", "json");
      expect(failure.status).not.toBe(0);
      expect(JSON.parse(failure.stdout)).toEqual({ error: expect.any(String), message: expect.stringContaining(id === "missing" ? "not found" : "removed") });
      expect(await inspect()).toEqual(after);
    }
  });

  it("rejects missing id, advertises help, and honors explicit text output", async () => {
    const before = await inspect();
    const missing = run("decision", "remove");
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain("--id");
    expect(await inspect()).toEqual(before);
    const help = run("decision", "remove", "--help");
    expect(help.status).toBe(0);
    expect(help.stdout).toContain("--id");
    expect(help.stdout).toContain("jumbo decision remove");

    const host = new Host(join(project, ".jumbo"));
    let decisionId: string;
    try {
      decisionId = (await (await host.createBuilder().build()).addDecisionController.handle({ title: "Text removal", context: "Output smoke" })).decisionId;
    } finally { host.dispose(); }
    const result = run("decision", "remove", "--id", decisionId, "--format", "text");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(decisionId);
    expect(() => JSON.parse(result.stdout)).toThrow();
  });

  it("does not create filesystem state outside a project", async () => {
    project = join(directory, "outside");
    await fs.ensureDir(project);
    await fs.writeFile(join(project, "sentinel"), "unchanged");
    const result = run("decision", "remove", "--id", "missing");
    expect(result.status).not.toBe(0);
    expect(await fs.readdir(project)).toEqual(["sentinel"]);
    expect(await fs.readFile(join(project, "sentinel"), "utf8")).toBe("unchanged");
  });
});
