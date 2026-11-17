import { IEventStore } from "../../../persistence/IEventStore.js";

/**
 * ActivityMirror - Summary of proactive context maintenance actions
 * taken during recent sessions.
 */
export interface ActivityMirror {
  readonly sessionCount: number;
  readonly entitiesRegistered: number;
  readonly decisionsRecorded: number;
  readonly relationsAdded: number;
  readonly goalsAdded: number;
}

const ENTITY_ADD_EVENTS = new Set([
  "ComponentAddedEvent",
  "InvariantAddedEvent",
  "GuidelineAddedEvent",
]);

const SESSION_LOOKBACK = 3;

/**
 * ActivityMirrorAssembler - Assembles a summary of proactive context
 * maintenance actions from recent sessions.
 *
 * Follows the query-time assembly pattern (dec_a6bd3bba): no new projections
 * or tables. Activity data is computed from existing events at query time.
 */
export class ActivityMirrorAssembler {
  constructor(private readonly eventStore: IEventStore) {}

  async assemble(): Promise<ActivityMirror | null> {
    const allEvents = await this.eventStore.getAllEvents();

    const sessionStarts = allEvents.filter(
      (e) => e.type === "SessionStartedEvent",
    );

    if (sessionStarts.length === 0) {
      return null;
    }

    const lookbackCount = Math.min(SESSION_LOOKBACK, sessionStarts.length);
    const cutoffTimestamp =
      sessionStarts[sessionStarts.length - lookbackCount].timestamp;

    let entitiesRegistered = 0;
    let decisionsRecorded = 0;
    let relationsAdded = 0;
    let goalsAdded = 0;

    for (const event of allEvents) {
      if (event.timestamp < cutoffTimestamp) continue;

      if (ENTITY_ADD_EVENTS.has(event.type)) {
        entitiesRegistered++;
      } else if (event.type === "DecisionAddedEvent") {
        decisionsRecorded++;
      } else if (event.type === "RelationAddedEvent") {
        relationsAdded++;
      } else if (event.type === "GoalAddedEvent") {
        goalsAdded++;
      }
    }

    const total =
      entitiesRegistered + decisionsRecorded + relationsAdded + goalsAdded;
    if (total === 0) {
      return null;
    }

    return {
      sessionCount: lookbackCount,
      entitiesRegistered,
      decisionsRecorded,
      relationsAdded,
      goalsAdded,
    };
  }
}
