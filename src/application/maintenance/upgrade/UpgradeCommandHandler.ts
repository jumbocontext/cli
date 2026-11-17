import { UpgradeCommand } from "./UpgradeCommand.js";
import { UpgradeResponse } from "./UpgradeResponse.js";
import { IEventStore } from "../../persistence/IEventStore.js";
import { IGoalStatusReader } from "../../context/goals/IGoalStatusReader.js";
import {
  GoalEventType,
  GoalStatusType,
} from "../../../domain/goals/Constants.js";
import { GoalStatusMigratedEvent } from "../../../domain/goals/migrate/GoalStatusMigratedEvent.js";

/**
 * Legacy status value → new status value mapping for v1 → v2 migration.
 * These are the literal string values that existed in v1 event payloads.
 */
const LEGACY_STATUS_MIGRATIONS: Record<string, GoalStatusType> = {
  "to-do": "defined" as GoalStatusType,
  qualified: "approved" as GoalStatusType,
  completed: "done" as GoalStatusType,
};

/**
 * Handles the v1 → v2 upgrade by appending GoalStatusMigratedEvent
 * for each goal currently in a legacy status.
 *
 * Idempotency: After the first run + db rebuild, no goals have legacy
 * status values, so a second run migrates zero goals.
 */
export class UpgradeCommandHandler {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly goalStatusReader: IGoalStatusReader,
  ) {}

  async handle(command: UpgradeCommand): Promise<UpgradeResponse> {
    if (command.from !== "v1" || command.to !== "v2") {
      throw new Error(
        `Unsupported upgrade path: ${command.from} → ${command.to}. Only v1 → v2 is supported.`,
      );
    }

    // 1. Query goal_views for goals with legacy status values
    const allGoals = await this.goalStatusReader.findAll();
    const legacyStatuses = Object.keys(LEGACY_STATUS_MIGRATIONS);
    const goalsToMigrate = allGoals.filter((g) =>
      legacyStatuses.includes(g.status),
    );

    let eventsAppended = 0;

    // 2. For each goal with a legacy status, append a GoalStatusMigratedEvent
    for (const goal of goalsToMigrate) {
      const newStatus = LEGACY_STATUS_MIGRATIONS[goal.status];

      // Read event stream to determine next version
      const history = await this.eventStore.readStream(goal.goalId);
      const lastEvent = history[history.length - 1];
      const nextVersion = lastEvent ? lastEvent.version + 1 : 1;

      const migrationEvent: GoalStatusMigratedEvent = {
        type: GoalEventType.STATUS_MIGRATED,
        aggregateId: goal.goalId,
        version: nextVersion,
        timestamp: new Date().toISOString(),
        payload: {
          fromStatus: goal.status,
          toStatus: newStatus,
          status: newStatus,
          migratedAt: new Date().toISOString(),
        },
      };

      await this.eventStore.append(migrationEvent);
      eventsAppended++;
    }

    return {
      migratedGoals: goalsToMigrate.length,
      eventsAppended,
      success: true,
    };
  }
}
