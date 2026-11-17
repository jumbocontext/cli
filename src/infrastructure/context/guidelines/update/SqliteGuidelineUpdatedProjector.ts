/**
 * SqliteGuidelineUpdatedProjector - SQLite projector for GuidelineUpdated event.
 */

import { Database } from "better-sqlite3";
import { IGuidelineUpdatedProjector } from "../../../../application/context/guidelines/update/IGuidelineUpdatedProjector.js";
import { IGuidelineUpdateReader } from "../../../../application/context/guidelines/update/IGuidelineUpdateReader.js";
import { GuidelineUpdatedEvent } from "../../../../domain/guidelines/update/GuidelineUpdatedEvent.js";
import { GuidelineView } from "../../../../application/context/guidelines/GuidelineView.js";
import { UUID } from "../../../../domain/BaseEvent.js";
import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export class SqliteGuidelineUpdatedProjector
  implements IGuidelineUpdatedProjector, IGuidelineUpdateReader
{
  constructor(private db: Database) {}

  async applyGuidelineUpdated(event: GuidelineUpdatedEvent): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (event.payload.category !== undefined) {
      updates.push("category = ?");
      params.push(event.payload.category);
    }
    if (event.payload.title !== undefined) {
      updates.push("title = ?");
      params.push(event.payload.title);
    }
    if (event.payload.description !== undefined) {
      updates.push("description = ?");
      params.push(event.payload.description);
    }
    if (event.payload.rationale !== undefined) {
      updates.push("rationale = ?");
      params.push(event.payload.rationale);
    }
    if (event.payload.examples !== undefined) {
      updates.push("examples = ?");
      params.push(JSON.stringify(event.payload.examples));
    }

    updates.push("version = ?");
    params.push(event.version);
    updates.push("updatedAt = ?");
    params.push(event.timestamp);
    params.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE guideline_views
      SET ${updates.join(", ")}
      WHERE guidelineId = ?
    `);

    stmt.run(...params);
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
