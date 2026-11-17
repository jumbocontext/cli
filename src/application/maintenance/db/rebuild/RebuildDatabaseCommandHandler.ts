import { RebuildDatabaseCommand } from "./RebuildDatabaseCommand.js";
import { IEventStore } from "../../../persistence/IEventStore.js";
import { IEventBus } from "../../../messaging/IEventBus.js";

/**
 * Handler for rebuilding the database from the event store.
 *
 * Strategy:
 * 1. Fetch all events from the event store (sorted by timestamp)
 * 2. Publish each event through the event bus
 * 3. Registered projection handlers rebuild materialized views
 *
 * Note: Database must be cleared before calling this handler.
 * The bootstrap process handles database initialization and migrations.
 */
export class RebuildDatabaseCommandHandler {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly eventBus: IEventBus,
  ) {}

  async handle(
    command: RebuildDatabaseCommand,
  ): Promise<RebuildDatabaseResult> {
    // Get all events sorted by timestamp
    const events = await this.eventStore.getAllEvents();

    let processedCount = 0;

    // Replay each event through the event bus
    // Projection handlers subscribed to the bus will rebuild views
    for (const event of events) {
      await this.eventBus.publish(event);
      processedCount++;
    }

    return {
      eventsReplayed: processedCount,
      success: true,
    };
  }
}

export interface RebuildDatabaseResult {
  eventsReplayed: number;
  success: boolean;
}
