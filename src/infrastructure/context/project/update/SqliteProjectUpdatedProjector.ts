/**
 * SqliteProjectUpdatedProjector - SQLite projector for ProjectUpdated event.
 */

import { Database } from "better-sqlite3";
import { IProjectUpdatedProjector } from "../../../../application/context/project/update/IProjectUpdatedProjector.js";
import { IProjectUpdateReader } from "../../../../application/context/project/update/IProjectUpdateReader.js";
import { ProjectUpdatedEvent } from "../../../../domain/project/update/ProjectUpdatedEvent.js";
import { ProjectView } from "../../../../application/context/project/ProjectView.js";

export class SqliteProjectUpdatedProjector
  implements IProjectUpdatedProjector, IProjectUpdateReader
{
  constructor(private db: Database) {}

  async applyProjectUpdated(event: ProjectUpdatedEvent): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (event.payload.purpose !== undefined) {
      updates.push("purpose = ?");
      params.push(event.payload.purpose);
    }
    updates.push("version = ?", "updatedAt = ?");
    params.push(event.version, event.timestamp);
    params.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE project_views
      SET ${updates.join(", ")}
      WHERE projectId = ?
    `);

    stmt.run(...params);
  }

  async getProject(): Promise<ProjectView | null> {
    const row = this.db.prepare("SELECT * FROM project_views LIMIT 1").get();
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): ProjectView {
    return {
      projectId: row.projectId as string,
      name: row.name as string,
      purpose: (row.purpose as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
