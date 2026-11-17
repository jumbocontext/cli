/**
 * SqliteAudienceContextReader - SQLite reader for audience context queries.
 *
 * Implements IAudienceContextReader for reading active audiences
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudienceContextReader } from "../../../../application/context/audiences/query/IAudienceContextReader.js";
import { AudienceView } from "../../../../application/context/audiences/AudienceView.js";
import { AudiencePriorityType } from "../../../../domain/audiences/Constants.js";

export class SqliteAudienceContextReader implements IAudienceContextReader {
  constructor(private db: Database) {}

  async findAllActive(): Promise<AudienceView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM audience_views WHERE isRemoved = 0 ORDER BY priority ASC, createdAt ASC",
      )
      .all();
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): AudienceView {
    return {
      audienceId: row.audienceId as string,
      name: row.name as string,
      description: row.description as string,
      priority: row.priority as AudiencePriorityType,
      isRemoved: Boolean(row.isRemoved),
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
