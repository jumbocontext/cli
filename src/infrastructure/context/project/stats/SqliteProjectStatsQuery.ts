import type { Database } from "better-sqlite3";
import type { IProjectStatsQuery } from "../../../../application/context/project/stats/IProjectStatsQuery.js";
import type { ProjectStatsSnapshotView } from "../../../../application/context/project/stats/ProjectStatsSnapshotView.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";

interface CountRow {
  readonly count: number;
}

const IN_PROGRESS_GOAL_STATUSES = [
  GoalStatus.IN_REFINEMENT,
  GoalStatus.DOING,
  GoalStatus.INREVIEW,
  GoalStatus.CODIFYING,
] as const;

export class SqliteProjectStatsQuery implements IProjectStatsQuery {
  constructor(private readonly db: Database) {}

  async currentSnapshot(): Promise<ProjectStatsSnapshotView> {
    return {
      project: {
        audiences: {
          totalAudiences: this.count(
            "SELECT COUNT(*) AS count FROM audience_views WHERE isRemoved = 0",
          ),
          primaryAudiences: this.count(
            "SELECT COUNT(*) AS count FROM audience_views WHERE isRemoved = 0 AND priority = 'primary'",
          ),
          secondaryAudiences: this.count(
            "SELECT COUNT(*) AS count FROM audience_views WHERE isRemoved = 0 AND priority = 'secondary'",
          ),
        },
        audiencePains: {
          audiencePainsCount: this.count(
            "SELECT COUNT(*) AS count FROM audience_pain_views WHERE status = 'active'",
          ),
        },
        valuePropositions: {
          valuePropositionsCount: this.count(
            "SELECT COUNT(*) AS count FROM value_proposition_views",
          ),
        },
      },
      work: {
        goals: {
          definedGoalsCount: this.countByStatus(GoalStatus.TODO),
          refinedGoalsCount: this.countByStatus(GoalStatus.REFINED),
          inProgressGoalsCount: this.countByStatuses(IN_PROGRESS_GOAL_STATUSES),
          submittedGoalsCount: this.countByStatus(GoalStatus.SUBMITTED),
          closedGoalsCount: this.countByStatus(GoalStatus.DONE),
        },
        sessions: {
          sessionsCount: this.count(
            "SELECT COUNT(*) AS count FROM session_views",
          ),
        },
      },
      memory: {
        decisions: {
          decisionsCount: this.count(
            "SELECT COUNT(*) AS count FROM decision_views WHERE status = 'active'",
          ),
        },
        components: {
          componentsCount: this.count(
            "SELECT COUNT(*) AS count FROM component_views WHERE status = 'active'",
          ),
        },
        dependencies: {
          dependenciesCount: this.count(
            "SELECT COUNT(*) AS count FROM dependency_views WHERE status = 'active'",
          ),
        },
        invariants: {
          invariantsCount: this.count(
            "SELECT COUNT(*) AS count FROM invariant_views",
          ),
        },
        guidelines: {
          guidelinesCount: this.count(
            "SELECT COUNT(*) AS count FROM guideline_views WHERE isRemoved = 0",
          ),
        },
      },
      graph: {
        relationCount: this.count(
          "SELECT COUNT(*) AS count FROM relation_views WHERE status = 'active'",
        ),
      },
    };
  }

  private count(sql: string): number {
    const row = this.db.prepare(sql).get() as CountRow | undefined;
    return row?.count ?? 0;
  }

  private countByStatus(status: string): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM goal_views WHERE status = ?")
      .get(status) as CountRow | undefined;

    return row?.count ?? 0;
  }

  private countByStatuses(statuses: readonly string[]): number {
    const placeholders = statuses.map(() => "?").join(", ");
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS count FROM goal_views WHERE status IN (${placeholders})`,
      )
      .get(...statuses) as CountRow | undefined;

    return row?.count ?? 0;
  }
}
