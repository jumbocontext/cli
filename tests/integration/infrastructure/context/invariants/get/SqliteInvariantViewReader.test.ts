import Database from "better-sqlite3";
import { SqliteInvariantViewReader } from "../../../../../../src/infrastructure/context/invariants/get/SqliteInvariantViewReader";

describe("SqliteInvariantViewReader", () => {
  let db: Database.Database;
  let reader: SqliteInvariantViewReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE invariant_views (
        invariantId TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        rationale TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    reader = new SqliteInvariantViewReader(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertInvariant(
    id: string,
    title: string,
    createdAt: string,
    description = "desc",
    rationale: string | null = "rationale"
  ): void {
    db.prepare(`
      INSERT INTO invariant_views (invariantId, title, description, rationale, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description, rationale, 1, createdAt, createdAt);
  }

  describe("findByIds", () => {
    it("should return empty array for empty input", async () => {
      const result = await reader.findByIds([]);
      expect(result).toEqual([]);
    });

    it("should return a single invariant by ID", async () => {
      insertInvariant("inv_1", "Single Responsibility", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["inv_1"]);

      expect(result).toHaveLength(1);
      expect(result[0].invariantId).toBe("inv_1");
      expect(result[0].title).toBe("Single Responsibility");
      expect(result[0]).not.toHaveProperty("en" + "forcement");
    });

    it("should return multiple invariants by IDs ordered by createdAt ASC", async () => {
      insertInvariant("inv_1", "First", "2025-01-01T00:00:00Z");
      insertInvariant("inv_2", "Second", "2025-01-02T00:00:00Z");
      insertInvariant("inv_3", "Third", "2025-01-03T00:00:00Z");

      const result = await reader.findByIds(["inv_1", "inv_2", "inv_3"]);

      expect(result).toHaveLength(3);
      expect(result[0].invariantId).toBe("inv_1");
      expect(result[1].invariantId).toBe("inv_2");
      expect(result[2].invariantId).toBe("inv_3");
    });

    it("should return empty array for non-existent IDs", async () => {
      insertInvariant("inv_1", "Existing", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["nonexistent_1", "nonexistent_2"]);

      expect(result).toEqual([]);
    });
  });

  describe("search", () => {
    it("should match title by substring and preserve createdAt ordering", async () => {
      insertInvariant("inv_2", "Clean Output", "2025-01-02T00:00:00Z");
      insertInvariant("inv_1", "Clean Architecture", "2025-01-01T00:00:00Z");
      insertInvariant("inv_3", "Single Responsibility", "2025-01-03T00:00:00Z");

      const result = await reader.search({ title: "Clean" });

      expect(result.map(invariant => invariant.invariantId)).toEqual(["inv_1", "inv_2"]);
    });

    it("should support star wildcards for title matching", async () => {
      insertInvariant("inv_1", "Clean Architecture", "2025-01-01T00:00:00Z");
      insertInvariant("inv_2", "Architecture Boundary", "2025-01-02T00:00:00Z");
      insertInvariant("inv_3", "Single Responsibility", "2025-01-03T00:00:00Z");

      const result = await reader.search({ title: "*Architecture" });

      expect(result.map(invariant => invariant.invariantId)).toEqual(["inv_1"]);
    });

    it("should match query across title, description, and rationale", async () => {
      insertInvariant("inv_1", "Clean Architecture", "2025-01-01T00:00:00Z");
      insertInvariant("inv_2", "Structured Output", "2025-01-02T00:00:00Z", "Stdout remains clean");
      insertInvariant("inv_3", "Dependency Inversion", "2025-01-03T00:00:00Z", "desc", "Avoid infrastructure coupling");

      const result = await reader.search({ query: "coupling" });

      expect(result.map(invariant => invariant.invariantId)).toEqual(["inv_3"]);
    });

    it("should combine title and query filters with AND logic", async () => {
      insertInvariant("inv_1", "Clean Architecture", "2025-01-01T00:00:00Z", "Keep layers distinct");
      insertInvariant("inv_2", "Clean Output", "2025-01-02T00:00:00Z", "Stdout remains clean");
      insertInvariant("inv_3", "Output Boundary", "2025-01-03T00:00:00Z", "Keep layers distinct");

      const result = await reader.search({ title: "Clean", query: "layers" });

      expect(result.map(invariant => invariant.invariantId)).toEqual(["inv_1"]);
    });

    it("should return all invariants in established order for empty criteria", async () => {
      insertInvariant("inv_2", "Second", "2025-01-02T00:00:00Z");
      insertInvariant("inv_1", "First", "2025-01-01T00:00:00Z");

      const result = await reader.search({});

      expect(result.map(invariant => invariant.invariantId)).toEqual(["inv_1", "inv_2"]);
    });
  });
});
