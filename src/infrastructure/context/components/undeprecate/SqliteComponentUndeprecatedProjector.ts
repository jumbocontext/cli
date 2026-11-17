import { Database } from "better-sqlite3";
import { IComponentUndeprecatedProjector } from "../../../../application/context/components/undeprecate/IComponentUndeprecatedProjector.js";
import { IComponentUndeprecateReader } from "../../../../application/context/components/undeprecate/IComponentUndeprecateReader.js";
import { ComponentUndeprecatedEvent } from "../../../../domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { ComponentView } from "../../../../application/context/components/ComponentView.js";
import {
  ComponentStatusValue,
  ComponentTypeValue,
} from "../../../../domain/components/Constants.js";

export class SqliteComponentUndeprecatedProjector
  implements IComponentUndeprecatedProjector, IComponentUndeprecateReader
{
  constructor(private db: Database) {}

  async applyComponentUndeprecated(
    event: ComponentUndeprecatedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE component_views
      SET status = 'active',
          deprecationReason = NULL,
          updatedAt = ?,
          version = ?
      WHERE componentId = ?
    `);

    stmt.run(event.timestamp, event.version, event.aggregateId);
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
