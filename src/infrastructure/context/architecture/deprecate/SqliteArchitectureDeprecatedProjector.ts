/**
 * SqliteArchitectureDeprecatedProjector - SQLite projector for ArchitectureDeprecated event.
 */

import { Database } from "better-sqlite3";
import { IArchitectureDeprecatedProjector } from "../../../../application/context/architecture/deprecate/IArchitectureDeprecatedProjector.js";
import { ArchitectureDeprecatedEvent } from "../../../../domain/architecture/deprecate/ArchitectureDeprecatedEvent.js";

export class SqliteArchitectureDeprecatedProjector implements IArchitectureDeprecatedProjector {
  constructor(private db: Database) {}

  async applyArchitectureDeprecated(
    event: ArchitectureDeprecatedEvent,
  ): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE architecture_views
      SET deprecated = 1, version = ?, updatedAt = ?
      WHERE architectureId = ?
    `);

    stmt.run(event.version, event.timestamp, event.aggregateId);
  }
}
