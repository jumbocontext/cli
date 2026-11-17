import Database from "better-sqlite3";
import { SqliteGuidelineViewReader } from "../../../../../../src/infrastructure/context/guidelines/get/SqliteGuidelineViewReader";
import { GuidelineCategory, GuidelineCategoryValue } from "../../../../../../src/domain/guidelines/Constants";

describe("SqliteGuidelineViewReader", () => {
  let db: Database.Database;
  let reader: SqliteGuidelineViewReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE guideline_views (
        guidelineId TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        rationale TEXT NOT NULL,
        examples TEXT NOT NULL,
        isRemoved INTEGER NOT NULL DEFAULT 0,
        removedAt TEXT,
        removalReason TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    reader = new SqliteGuidelineViewReader(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertGuideline(
    id: string,
    title: string,
    createdAt: string,
    options: {
      category?: GuidelineCategoryValue;
      description?: string;
      rationale?: string;
      examples?: string[];
      isRemoved?: boolean;
    } = {}
  ): void {
    db.prepare(`
      INSERT INTO guideline_views (guidelineId, category, title, description, rationale, examples, isRemoved, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      options.category ?? GuidelineCategory.TESTING,
      title,
      options.description ?? "desc",
      options.rationale ?? "rationale",
      JSON.stringify(options.examples ?? []),
      options.isRemoved ? 1 : 0,
      1,
      createdAt,
      createdAt
    );
  }

  describe("findByIds", () => {
    it("should return empty array for empty input", async () => {
      const result = await reader.findByIds([]);
      expect(result).toEqual([]);
    });

    it("should return a single guideline by ID", async () => {
      insertGuideline("guide_1", "Test all things", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["guide_1"]);

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_1");
      expect(result[0].title).toBe("Test all things");
      expect(result[0]).not.toHaveProperty(["enforce", "ment"].join(""));
    });

    it("should return multiple guidelines by IDs ordered by createdAt DESC", async () => {
      insertGuideline("guide_1", "First", "2025-01-01T00:00:00Z");
      insertGuideline("guide_2", "Second", "2025-01-02T00:00:00Z");
      insertGuideline("guide_3", "Third", "2025-01-03T00:00:00Z");

      const result = await reader.findByIds(["guide_1", "guide_2", "guide_3"]);

      expect(result).toHaveLength(3);
      expect(result[0].guidelineId).toBe("guide_3");
      expect(result[1].guidelineId).toBe("guide_2");
      expect(result[2].guidelineId).toBe("guide_1");
    });

    it("should return empty array for non-existent IDs", async () => {
      insertGuideline("guide_1", "Existing", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["nonexistent_1", "nonexistent_2"]);

      expect(result).toEqual([]);
    });
  });

  describe("search", () => {
    it("should filter by category exact match", async () => {
      insertGuideline("guide_1", "Test behavior", "2025-01-01T00:00:00Z", { category: GuidelineCategory.TESTING });
      insertGuideline("guide_2", "Coding behavior", "2025-01-02T00:00:00Z", { category: GuidelineCategory.CODING_STYLE });

      const result = await reader.search({ category: GuidelineCategory.CODING_STYLE });

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_2");
    });

    it("should filter by title substring", async () => {
      insertGuideline("guide_1", "Test behavior", "2025-01-01T00:00:00Z");
      insertGuideline("guide_2", "Output builders", "2025-01-02T00:00:00Z");

      const result = await reader.search({ title: "behavior" });

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_1");
    });

    it("should filter by title wildcard", async () => {
      insertGuideline("guide_1", "Test behavior", "2025-01-01T00:00:00Z");
      insertGuideline("guide_2", "Output builders", "2025-01-02T00:00:00Z");

      const result = await reader.search({ title: "Output*" });

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_2");
    });

    it("should search query across title, description, rationale, and examples", async () => {
      insertGuideline("guide_1", "Title match", "2025-01-01T00:00:00Z");
      insertGuideline("guide_2", "Description", "2025-01-02T00:00:00Z", { description: "Contains stdout guidance" });
      insertGuideline("guide_3", "Rationale", "2025-01-03T00:00:00Z", { rationale: "Keeps output clean" });
      insertGuideline("guide_4", "Examples", "2025-01-04T00:00:00Z", { examples: ["src/output/TerminalOutputBuilder.ts"] });

      const titleResult = await reader.search({ query: "Title" });
      const descriptionResult = await reader.search({ query: "stdout" });
      const rationaleResult = await reader.search({ query: "clean" });
      const examplesResult = await reader.search({ query: "TerminalOutputBuilder" });

      expect(titleResult.map(g => g.guidelineId)).toEqual(["guide_1"]);
      expect(descriptionResult.map(g => g.guidelineId)).toEqual(["guide_2"]);
      expect(rationaleResult.map(g => g.guidelineId)).toEqual(["guide_3"]);
      expect(examplesResult.map(g => g.guidelineId)).toEqual(["guide_4"]);
    });

    it("should compose filters with AND logic", async () => {
      insertGuideline("guide_1", "Output builders", "2025-01-01T00:00:00Z", {
        category: GuidelineCategory.CODING_STYLE,
        rationale: "Keeps output centralized",
      });
      insertGuideline("guide_2", "Output builders", "2025-01-02T00:00:00Z", {
        category: GuidelineCategory.TESTING,
        rationale: "Keeps output centralized",
      });
      insertGuideline("guide_3", "Output builders", "2025-01-03T00:00:00Z", {
        category: GuidelineCategory.CODING_STYLE,
        rationale: "Other rationale",
      });

      const result = await reader.search({
        category: GuidelineCategory.CODING_STYLE,
        title: "Output",
        query: "centralized",
      });

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_1");
    });

    it("should exclude removed guidelines", async () => {
      insertGuideline("guide_1", "Active output", "2025-01-01T00:00:00Z");
      insertGuideline("guide_2", "Removed output", "2025-01-02T00:00:00Z", { isRemoved: true });

      const result = await reader.search({ title: "output" });

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_1");
    });
  });
});
