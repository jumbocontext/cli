/**
 * SqliteRelationAddedProjector - SQLite projector for RelationAdded event.
 *
 * Implements IRelationAddedProjector and IRelationAddedReader for projecting
 * relation add events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IRelationAddedProjector } from "../../../../application/context/relations/add/IRelationAddedProjector.js";
import { IRelationAddedReader } from "../../../../application/context/relations/add/IRelationAddedReader.js";
import { RelationAddedEvent } from "../../../../domain/relations/add/RelationAddedEvent.js";
import { RelationView } from "../../../../application/context/relations/RelationView.js";
import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

export class SqliteRelationAddedProjector implements IRelationAddedProjector, IRelationAddedReader {
  constructor(private db: Database) {}

  async applyRelationAdded(event: RelationAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO relation_views (
        relationId, fromEntityType, fromEntityId, toEntityType, toEntityId,
        relationType, strength, description, status, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(relationId) DO NOTHING
    `);

    stmt.run(
      event.aggregateId,
      event.payload.fromEntityType,
      event.payload.fromEntityId,
      event.payload.toEntityType,
      event.payload.toEntityId,
      event.payload.relationType,
      event.payload.strength,
      event.payload.description,
      'active',
      event.version,
      event.timestamp,
      event.timestamp
    );
  }

  async findByEntities(
    fromEntityType: EntityTypeValue,
    fromEntityId: string,
    toEntityType: EntityTypeValue,
    toEntityId: string,
    relationType: string
  ): Promise<RelationView | null> {
    const row = this.db.prepare(`
      SELECT * FROM relation_views
      WHERE fromEntityType = ?
        AND fromEntityId = ?
        AND toEntityType = ?
        AND toEntityId = ?
        AND relationType = ?
        AND status != 'removed'
    `).get(fromEntityType, fromEntityId, toEntityType, toEntityId, relationType) as Record<string, unknown> | undefined;

    return row ? this.mapRowToView(row) : null;
  }

  private mapRowToView(row: Record<string, unknown>): RelationView {
    return {
      relationId: row.relationId as string,
      fromEntityType: row.fromEntityType as EntityTypeValue,
      fromEntityId: row.fromEntityId as string,
      toEntityType: row.toEntityType as EntityTypeValue,
      toEntityId: row.toEntityId as string,
      relationType: row.relationType as string,
      strength: row.strength as RelationView['strength'],
      description: row.description as string,
      status: row.status as 'active' | 'deactivated' | 'removed',
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
