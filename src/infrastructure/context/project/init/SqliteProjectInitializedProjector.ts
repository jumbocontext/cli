/**
 * SqliteProjectInitializedProjector - SQLite projector for ProjectInitialized event.
 */

import { Database } from "better-sqlite3";
import { IProjectInitializedProjector } from "../../../../application/context/project/init/IProjectInitializedProjector.js";
import { IProjectInitReader } from "../../../../application/context/project/init/IProjectInitReader.js";
import { ProjectInitializedEvent } from "../../../../domain/project/init/ProjectInitializedEvent.js";
import { ProjectView } from "../../../../application/context/project/ProjectView.js";

export class SqliteProjectInitializedProjector
  implements IProjectInitializedProjector, IProjectInitReader
{
  constructor(private db: Database) {}

  async applyProjectInitialized(event: ProjectInitializedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO project_views (
        projectId, name, purpose,
        version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.name,
      event.payload.purpose,
      event.version,
      event.timestamp,
      event.timestamp,
    );
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
