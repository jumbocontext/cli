/**
 * SqliteComponentRenamedProjector - SQLite projector for ComponentRenamed event.
 *
 * Implements IComponentRenamedProjector and IComponentRenameReader for projecting
 * component rename events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IComponentRenamedProjector } from "../../../../application/context/components/rename/IComponentRenamedProjector.js";
import { IComponentRenameReader } from "../../../../application/context/components/rename/IComponentRenameReader.js";
import { ComponentRenamedEvent } from "../../../../domain/components/EventIndex.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../../domain/components/Constants.js";

export class SqliteComponentRenamedProjector
  implements IComponentRenamedProjector, IComponentRenameReader
{
  constructor(private db: Database) {}

  async applyComponentRenamed(event: ComponentRenamedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE component_views
      SET name = ?, version = ?, updatedAt = ?
      WHERE componentId = ?
    `);

    stmt.run(
      event.payload.name,
      event.version,
      event.timestamp,
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
