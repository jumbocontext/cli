import { Database } from "better-sqlite3";
import { IBrownfieldStatusReader } from "../../../../application/context/sessions/start/IBrownfieldStatusReader.js";
import { ComponentStatus } from "../../../../domain/components/Constants.js";
import { DecisionStatus } from "../../../../domain/decisions/Constants.js";

/**
 * SqliteBrownfieldStatusReader - Checks if any solution context exists
 *
 * Uses a single EXISTS query across all solution entity tables rather than
 * hydrating full entity views. A project is considered "primed" if ANY of
 * the following exist: architecture, active components, active decisions,
 * invariants, or active guidelines.
 */
export class SqliteBrownfieldStatusReader implements IBrownfieldStatusReader {
  constructor(private readonly db: Database) {}

  async isUnprimed(): Promise<boolean> {
    const row = this.db
      .prepare(
        `SELECT
           EXISTS(SELECT 1 FROM architecture_views) OR
           EXISTS(SELECT 1 FROM component_views WHERE status = ?) OR
           EXISTS(SELECT 1 FROM decision_views WHERE status = ?) OR
           EXISTS(SELECT 1 FROM invariant_views) OR
           EXISTS(SELECT 1 FROM guideline_views WHERE isRemoved = 0)
         AS hasSolutionContext`,
      )
      .get(ComponentStatus.ACTIVE, DecisionStatus.ACTIVE) as {
      hasSolutionContext: number;
    };

    return row.hasSolutionContext === 0;
  }
}
