/**
 * SqliteComponentRemovedProjector - SQLite projector for ComponentRemoved event.
 *
 * Implements IComponentRemovedProjector and IComponentRemoveReader for projecting
 * component remove events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IComponentRemovedProjector } from "../../../../application/context/components/remove/IComponentRemovedProjector.js";
import { IComponentRemoveReader } from "../../../../application/context/components/remove/IComponentRemoveReader.js";
import { ComponentRemovedEvent } from "../../../../domain/components/EventIndex.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../../domain/components/Constants.js";

export class SqliteComponentRemovedProjector
  implements IComponentRemovedProjector, IComponentRemoveReader
{
  constructor(private db: Database) {}

  async applyComponentRemoved(event: ComponentRemovedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE component_views
      SET status = ?,
          updatedAt = ?,
          version = ?
      WHERE componentId = ?
    `);

    stmt.run(
      event.payload.status,
      event.timestamp,
      event.version,
      event.aggregateId,
    );
  }

  async findById(id: string): Promise<ComponentView | null> {
    const row = this.db
      .prepare("SELECT * FROM component_views WHERE componentId = ?")
      .get(id);
    return row ? this.mapRowToView(row as Record<string, unknown>) : null;
  }

  private mapRowToView(row: Record<string, unknown>): ComponentView {
    return {
      componentId: row.componentId as string,
      name: row.name as string,
      type: row.type as ComponentTypeValue,
      description: row.description as string,
      responsibility: row.responsibility as string,
      path: row.path as string,
      status: row.status as ComponentStatusValue,
      deprecationReason: (row.deprecationReason as string) ?? null,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
