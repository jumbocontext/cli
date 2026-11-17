/**
 * SqliteGuidelineAddedProjector - SQLite projector for GuidelineAdded event.
 */

import { Database } from "better-sqlite3";
import { IGuidelineAddedProjector } from "../../../../application/context/guidelines/add/IGuidelineAddedProjector.js";
import { GuidelineAddedEvent } from "../../../../domain/guidelines/add/GuidelineAddedEvent.js";
import { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";
import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export class SqliteGuidelineAddedProjector implements IGuidelineAddedProjector {
  constructor(private db: Database) {}

  async applyGuidelineAdded(event: GuidelineAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO guideline_views (
        guidelineId, category, title, description, rationale,
        examples, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.category,
      event.payload.title,
      event.payload.description,
      event.payload.rationale,
      JSON.stringify(event.payload.examples),
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }

  async findByCategory(category: string): Promise<GuidelineView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM guideline_views WHERE category = ? ORDER BY createdAt DESC",
      )
      .all(category);
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): GuidelineView {
    return {
      guidelineId: row.guidelineId as string,
      category: row.category as GuidelineCategoryValue,
      title: row.title as string,
      description: row.description as string,
      rationale: row.rationale as string,
      examples: JSON.parse((row.examples as string) || "[]"),
      isRemoved: (row.isRemoved as number) === 1,
      removedAt: (row.removedAt as string) ?? null,
      removalReason: (row.removalReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
