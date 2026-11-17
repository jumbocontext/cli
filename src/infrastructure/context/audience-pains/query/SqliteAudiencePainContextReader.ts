/**
 * SqliteAudiencePainContextReader - SQLite reader for audience pain context queries.
 *
 * Implements IAudiencePainContextReader for reading active audience pains
 * from the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IAudiencePainContextReader } from "../../../../application/context/audience-pains/query/IAudiencePainContextReader.js";
import { AudiencePainView } from "../../../../application/context/audience-pains/AudiencePainView.js";
import {
  AudiencePainStatus,
  AudiencePainStatusType,
} from "../../../../domain/audience-pains/Constants.js";

export class SqliteAudiencePainContextReader implements IAudiencePainContextReader {
  constructor(private db: Database) {}

  async findAllActive(): Promise<AudiencePainView[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM audience_pain_views WHERE status = ? ORDER BY createdAt ASC",
      )
      .all(AudiencePainStatus.ACTIVE);
    return rows.map((row) => this.mapRowToView(row as Record<string, unknown>));
  }

  private mapRowToView(row: Record<string, unknown>): AudiencePainView {
    return {
      painId: row.painId as string,
      title: row.title as string,
      description: row.description as string,
      status: row.status as AudiencePainStatusType,
      resolvedAt: (row.resolvedAt as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
