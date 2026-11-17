/**
 * SqliteGuidelineRemovedProjector - SQLite projector for GuidelineRemoved event.
 */

import { Database } from "better-sqlite3";
import { IGuidelineRemovedProjector } from "../../../../application/context/guidelines/remove/IGuidelineRemovedProjector.js";
import { IGuidelineRemoveReader } from "../../../../application/context/guidelines/remove/IGuidelineRemoveReader.js";
import { GuidelineRemovedEvent } from "../../../../domain/guidelines/remove/GuidelineRemovedEvent.js";
import { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";
import { UUID } from "../../../../domain/BaseEvent.js";
import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export class SqliteGuidelineRemovedProjector
  implements IGuidelineRemovedProjector, IGuidelineRemoveReader
{
  constructor(private db: Database) {}

  async applyGuidelineRemoved(event: GuidelineRemovedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE guideline_views
      SET isRemoved = 1,
          removedAt = ?,
          removalReason = ?,
          version = ?,
          updatedAt = ?
      WHERE guidelineId = ?
    `);

    stmt.run(
      event.payload.removedAt,
      event.payload.reason || null,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }

  async findById(
    id: UUID,
    includeRemoved: boolean = false,
  ): Promise<GuidelineView | null> {
    const query = includeRemoved
      ? "SELECT * FROM guideline_views WHERE guidelineId = ?"
      : "SELECT * FROM guideline_views WHERE guidelineId = ? AND isRemoved = 0";

    const row = this.db.prepare(query).get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
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
