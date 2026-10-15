import Database from "better-sqlite3";
import { DecisionStatus } from "../../../../../src/domain/decisions/Constants.js";
import type { DecisionView } from "../../../../../src/application/context/decisions/DecisionView.js";
import { SqliteDecisionViewReader } from "../../../../../src/infrastructure/context/decisions/get/SqliteDecisionViewReader";

describe("SqliteDecisionViewReader", () => {
  let db: Database.Database;
  let reader: SqliteDecisionViewReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE decision_views (
        decisionId TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        context TEXT NOT NULL,
        rationale TEXT,
        alternatives TEXT,
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
    reader = new SqliteDecisionViewReader(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertDecision(
    id: string,
    title: string,
    createdAt: string,
    overrides: {
      context?: string;
      rationale?: string | null;
      alternatives?: string[];
      consequences?: string | null;
      status?: DecisionView["status"];
      supersededBy?: string | null;
      reversalReason?: string | null;
      reversedAt?: string | null;
    } = {}
  ): void {
    db.prepare(`
      INSERT INTO decision_views (
        decisionId,
        title,
        context,
        rationale,
        alternatives,
        consequences,
        status,
        supersededBy,
        reversalReason,
        reversedAt,
        version,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      overrides.context ?? "context",
      overrides.rationale ?? "rationale",
      JSON.stringify(overrides.alternatives ?? []),
      overrides.consequences ?? null,
      overrides.status ?? "active",
      overrides.supersededBy ?? null,
      overrides.reversalReason ?? null,
      overrides.reversedAt ?? null,
      1,
      createdAt,
      createdAt
    );
  }

  it("retains removed history in all/ID/search queries and supports explicit status filters", async () => {
    insertDecision("dec_active", "Shared choice", "2025-01-01T00:00:00Z");
    insertDecision("dec_removed", "Shared choice", "2025-01-02T00:00:00Z", { status: DecisionStatus.REMOVED });
    const allIds = ["dec_removed", "dec_active"];
    expect((await reader.findAll()).map(decision => decision.decisionId)).toEqual(allIds);
    expect((await reader.findAll("all")).map(decision => decision.decisionId)).toEqual(allIds);
    expect((await reader.findAll(DecisionStatus.REMOVED)).map(decision => decision.decisionId)).toEqual(["dec_removed"]);
    expect((await reader.findAll(DecisionStatus.ACTIVE)).map(decision => decision.decisionId)).toEqual(["dec_active"]);
    expect((await reader.findByIds([...allIds, "missing"])).map(decision => decision.decisionId)).toEqual(allIds);
    expect((await reader.search({ query: "Shared" })).map(decision => decision.decisionId)).toEqual(allIds);
    expect((await reader.search({ status: "all" })).map(decision => decision.decisionId)).toEqual(allIds);
    expect((await reader.search({ status: DecisionStatus.REMOVED, title: "Shared", query: "choice" })).map(decision => decision.decisionId)).toEqual(["dec_removed"]);
    expect((await reader.search({ status: DecisionStatus.ACTIVE })).map(decision => decision.decisionId)).toEqual(["dec_active"]);
  });

  describe("findByIds", () => {
    it("should return empty array for empty input", async () => {
      const result = await reader.findByIds([]);
      expect(result).toEqual([]);
    });

    it("should return a single decision by ID", async () => {
      insertDecision("dec_1", "Use REST", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["dec_1"]);

      expect(result).toHaveLength(1);
      expect(result[0].decisionId).toBe("dec_1");
      expect(result[0].title).toBe("Use REST");
    });

    it("should return multiple decisions by IDs ordered by createdAt DESC", async () => {
      insertDecision("dec_1", "First", "2025-01-01T00:00:00Z");
      insertDecision("dec_2", "Second", "2025-01-02T00:00:00Z");
      insertDecision("dec_3", "Third", "2025-01-03T00:00:00Z");

      const result = await reader.findByIds(["dec_1", "dec_2", "dec_3"]);

      expect(result).toHaveLength(3);
      expect(result[0].decisionId).toBe("dec_3");
      expect(result[1].decisionId).toBe("dec_2");
      expect(result[2].decisionId).toBe("dec_1");
    });

    it("should return empty array for non-existent IDs", async () => {
      insertDecision("dec_1", "Existing", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["nonexistent_1", "nonexistent_2"]);

      expect(result).toEqual([]);
    });
  });

  describe("search", () => {
    it("should search by title substring and order by createdAt DESC", async () => {
      insertDecision("dec_1", "Use REST API", "2025-01-01T00:00:00Z");
      insertDecision("dec_2", "Use Event API", "2025-01-03T00:00:00Z");
      insertDecision("dec_3", "Adopt SQLite", "2025-01-02T00:00:00Z");

      const result = await reader.search({ title: "API" });

      expect(result.map(d => d.decisionId)).toEqual(["dec_2", "dec_1"]);
    });

    it("should support star wildcards for title search", async () => {
      insertDecision("dec_1", "Use REST API", "2025-01-01T00:00:00Z");
      insertDecision("dec_2", "Adopt API Gateway", "2025-01-02T00:00:00Z");
      insertDecision("dec_3", "Use SQLite", "2025-01-03T00:00:00Z");

      const result = await reader.search({ title: "Use*" });

      expect(result.map(d => d.decisionId)).toEqual(["dec_3", "dec_1"]);
    });

    it("should compose status, title, and query filters with AND logic", async () => {
      insertDecision("dec_1", "Use Gateway Pattern", "2025-01-01T00:00:00Z", {
        context: "Controller boundary",
        status: "active",
      });
      insertDecision("dec_2", "Use Gateway Pattern", "2025-01-02T00:00:00Z", {
        context: "Controller boundary",
        status: "superseded",
      });
      insertDecision("dec_3", "Use Repository Pattern", "2025-01-03T00:00:00Z", {
        context: "Controller boundary",
        status: "active",
      });

      const result = await reader.search({
        status: "active",
        title: "Gateway",
        query: "Controller",
      });

      expect(result.map(d => d.decisionId)).toEqual(["dec_1"]);
    });

    it("should treat omitted status and all status as all decisions", async () => {
      insertDecision("dec_1", "Active Decision", "2025-01-01T00:00:00Z", { status: "active" });
      insertDecision("dec_2", "Superseded Decision", "2025-01-02T00:00:00Z", { status: "superseded" });
      insertDecision("dec_3", "Reversed Decision", "2025-01-03T00:00:00Z", { status: "reversed" });

      const omitted = await reader.search({});
      const all = await reader.search({ status: "all" });

      expect(omitted.map(d => d.decisionId)).toEqual(["dec_3", "dec_2", "dec_1"]);
      expect(all.map(d => d.decisionId)).toEqual(["dec_3", "dec_2", "dec_1"]);
    });

    it("should search query across decision text fields", async () => {
      insertDecision("dec_1", "Use Repository", "2025-01-01T00:00:00Z", {
        rationale: "Keeps storage hidden",
      });
      insertDecision("dec_2", "Use Ports", "2025-01-02T00:00:00Z", {
        alternatives: ["gateway boundary"],
      });
      insertDecision("dec_3", "Reverse Old Choice", "2025-01-03T00:00:00Z", {
        status: "reversed",
        reversalReason: "stdout pollution",
      });
      insertDecision("dec_4", "Supersede Old Choice", "2025-01-04T00:00:00Z", {
        status: "superseded",
        supersededBy: "dec_target",
      });

      const rationaleResult = await reader.search({ query: "storage hidden" });
      const alternativesResult = await reader.search({ query: "gateway" });
      const reversalResult = await reader.search({ query: "stdout" });
      const supersededByResult = await reader.search({ query: "dec_target" });

      expect(rationaleResult.map(d => d.decisionId)).toEqual(["dec_1"]);
      expect(alternativesResult.map(d => d.decisionId)).toEqual(["dec_2"]);
      expect(reversalResult.map(d => d.decisionId)).toEqual(["dec_3"]);
      expect(supersededByResult.map(d => d.decisionId)).toEqual(["dec_4"]);
    });
  });
});
