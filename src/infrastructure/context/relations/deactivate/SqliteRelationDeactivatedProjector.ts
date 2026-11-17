import { Database } from "better-sqlite3";
import { IRelationDeactivatedProjector } from "../../../../application/context/relations/deactivate/IRelationDeactivatedProjector.js";
import { IRelationDeactivatedReader } from "../../../../application/context/relations/deactivate/IRelationDeactivatedReader.js";
import { IRelationReader } from "../../../../application/context/relations/IRelationReader.js";
import { RelationDeactivatedEvent } from "../../../../domain/relations/deactivate/RelationDeactivatedEvent.js";
import { RelationView } from "../../../../application/context/relations/RelationView.js";
import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../domain/relations/Constants.js";

export class SqliteRelationDeactivatedProjector
  implements
    IRelationDeactivatedProjector,
    IRelationDeactivatedReader,
    IRelationReader
{
  constructor(private db: Database) {}

  async applyRelationDeactivated(
    event: RelationDeactivatedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE relation_views
      SET status = 'deactivated',
          version = ?,
          updatedAt = ?
      WHERE relationId = ?
    `);

    stmt.run(event.version, event.timestamp, event.aggregateId);
  }

  async findById(id: string): Promise<RelationView | null> {
    const row = this.db
      .prepare("SELECT * FROM relation_views WHERE relationId = ?")
      .get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRowToView(row) : null;
  }

  async findByFromEntity(
    entityType: EntityTypeValue,
    entityId: string,
  ): Promise<RelationView[]> {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM relation_views
      WHERE fromEntityType = ? AND fromEntityId = ?
      ORDER BY createdAt ASC
    `,
      )
      .all(entityType, entityId) as Record<string, unknown>[];

    return rows.map((row) => this.mapRowToView(row));
  }

  async findByToEntity(
    entityType: EntityTypeValue,
    entityId: string,
  ): Promise<RelationView[]> {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM relation_views
      WHERE toEntityType = ? AND toEntityId = ?
      ORDER BY createdAt ASC
    `,
      )
      .all(entityType, entityId) as Record<string, unknown>[];

    return rows.map((row) => this.mapRowToView(row));
  }

  private mapRowToView(row: Record<string, unknown>): RelationView {
    return {
      relationId: row.relationId as string,
      fromEntityType: row.fromEntityType as EntityTypeValue,
      fromEntityId: row.fromEntityId as string,
      toEntityType: row.toEntityType as EntityTypeValue,
      toEntityId: row.toEntityId as string,
      relationType: row.relationType as string,
      strength: row.strength as RelationStrengthValue | null,
      description: row.description as string,
      status: row.status as "active" | "deactivated" | "removed",
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
