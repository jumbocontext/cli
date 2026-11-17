/**
 * SqliteComponentUpdatedProjector - SQLite projector for ComponentUpdated event.
 *
 * Implements IComponentUpdatedProjector and IComponentUpdateReader for projecting
 * component update events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IComponentUpdatedProjector } from "../../../../application/context/components/update/IComponentUpdatedProjector.js";
import { IComponentUpdateReader } from "../../../../application/context/components/update/IComponentUpdateReader.js";
import { ComponentUpdatedEvent } from "../../../../domain/components/EventIndex.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../../domain/components/Constants.js";

export class SqliteComponentUpdatedProjector
  implements IComponentUpdatedProjector, IComponentUpdateReader
{
  constructor(private db: Database) {}

  async applyComponentUpdated(event: ComponentUpdatedEvent): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (event.payload.description !== undefined) {
      updates.push("description = ?");
      params.push(event.payload.description);
    }
    if (event.payload.responsibility !== undefined) {
      updates.push("responsibility = ?");
      params.push(event.payload.responsibility);
    }
    if (event.payload.path !== undefined) {
      updates.push("path = ?");
      params.push(event.payload.path);
    }
    if (event.payload.type !== undefined) {
      updates.push("type = ?");
      params.push(event.payload.type);
    }

    updates.push("version = ?");
    params.push(event.version);
    updates.push("updatedAt = ?");
    params.push(event.timestamp);
    params.push(event.aggregateId);

    const stmt = this.db.prepare(`
      UPDATE component_views
      SET ${updates.join(", ")}
      WHERE componentId = ?
    `);

    stmt.run(...params);
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
