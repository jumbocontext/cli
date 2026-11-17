/**
 * SqliteComponentDeprecatedProjector - SQLite projector for ComponentDeprecated event.
 *
 * Implements IComponentDeprecatedProjector and IComponentDeprecateReader for projecting
 * component deprecate events to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IComponentDeprecatedProjector } from "../../../../application/context/components/deprecate/IComponentDeprecatedProjector.js";
import { IComponentDeprecateReader } from "../../../../application/context/components/deprecate/IComponentDeprecateReader.js";
import { ComponentDeprecatedEvent } from "../../../../domain/components/EventIndex.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import {
  ComponentTypeValue,
  ComponentStatusValue,
} from "../../../../domain/components/Constants.js";

export class SqliteComponentDeprecatedProjector
  implements IComponentDeprecatedProjector, IComponentDeprecateReader
{
  constructor(private db: Database) {}

  async applyComponentDeprecated(
    event: ComponentDeprecatedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE component_views
      SET status = ?,
          deprecationReason = ?,
          updatedAt = ?,
          version = ?
      WHERE componentId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.reason,
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
