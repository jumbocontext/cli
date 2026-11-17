/**
 * SqliteProjectContextReader - SQLite reader for project context queries.
 */

import { Database } from "better-sqlite3";
import { IProjectContextReader } from "../../../../application/context/project/query/IProjectContextReader.js";
import { ProjectView } from "../../../../application/context/project/ProjectView.js";
import { ProjectKnowledgeInventoryView } from "../../../../application/context/project/ProjectKnowledgeInventoryView.js";
import { ProjectLifecycleState } from "../../../../application/context/project/ProjectLifecycleState.js";
import { ProjectLifecycleClassifier } from "../../../../application/context/project/query/ProjectLifecycleClassifier.js";
import { ComponentStatus } from "../../../../domain/components/Constants.js";
import { DecisionStatus } from "../../../../domain/decisions/Constants.js";

export class SqliteProjectContextReader implements IProjectContextReader {
  private readonly lifecycleClassifier = new ProjectLifecycleClassifier();

  constructor(private db: Database) {}

  async getProject(): Promise<ProjectView | null> {
    const row = this.db.prepare("SELECT * FROM project_views LIMIT 1").get();

    if (!row) {
      return null;
    }

    const lifecycleState = await this.getProjectLifecycleState();
    return this.mapRowToView(row as Record<string, unknown>, lifecycleState);
  }

  async getProjectLifecycleState(): Promise<ProjectLifecycleState> {
    const inventory = await this.getProjectKnowledgeInventory();
    return this.lifecycleClassifier.classify(inventory);
  }

  async getProjectKnowledgeInventory(): Promise<ProjectKnowledgeInventoryView> {
    const row = this.db
      .prepare(
        `SELECT
           EXISTS(SELECT 1 FROM project_views) AS projectInitialized,
           (
             (SELECT COUNT(*) FROM architecture_views) +
             (SELECT COUNT(*) FROM component_views WHERE status = ?) +
             (SELECT COUNT(*) FROM decision_views WHERE status = ?) +
             (SELECT COUNT(*) FROM invariant_views) +
             (SELECT COUNT(*) FROM guideline_views WHERE isRemoved = 0)
           ) AS solutionContextItemCount,
           (SELECT COUNT(*) FROM goal_views) AS launchpadReadyGoalCount`,
      )
      .get(ComponentStatus.ACTIVE, DecisionStatus.ACTIVE) as Record<
      string,
      unknown
    >;

    return {
      projectInitialized: row.projectInitialized === 1,
      solutionContextItemCount: row.solutionContextItemCount as number,
      launchpadReadyGoalCount: row.launchpadReadyGoalCount as number,
    };
  }

  private mapRowToView(
    row: Record<string, unknown>,
    lifecycleState: ProjectLifecycleState,
  ): ProjectView {
    return {
      projectId: row.projectId as string,
      name: row.name as string,
      purpose: (row.purpose as string) ?? null,
      lifecycleState,
      version: row.version as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  }
}
