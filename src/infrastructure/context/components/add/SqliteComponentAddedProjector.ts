/**
 * SqliteComponentAddedProjector - SQLite projector for ComponentAdded event.
 *
 * Implements IComponentAddedProjector and IComponentAddReader for projecting
 * component add events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IComponentAddedProjector } from "../../../../application/context/components/add/IComponentAddedProjector.js";
import { IComponentAddReader } from "../../../../application/context/components/add/IComponentAddReader.js";
import { ComponentAddedEvent } from "../../../../domain/components/EventIndex.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../../domain/components/Constants.js";

export class SqliteComponentAddedProjector
  implements IComponentAddedProjector, IComponentAddReader
{
  constructor(private db: Database) {}

  async applyComponentAdded(event: ComponentAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO component_views (
        componentId, name, type, description, responsibility,
        path, status, deprecationReason, version, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.name,
      event.payload.type,
      event.payload.description,
      event.payload.responsibility,
      event.payload.path,
      event.payload.status,
      null,
      event.version,
      event.timestamp,
      event.timestamp,
    );
  }

  async findByName(name: string): Promise<ComponentView | null> {
    const row = this.db
      .prepare("SELECT * FROM component_views WHERE name = ?")
      .get(name);
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
