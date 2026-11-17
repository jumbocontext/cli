/**
 * UpdateAudienceCommandHandler - Command handler for audience updates.
 *
 * This handler:
 * 1. Loads existing Audience aggregate from event store
 * 2. Rehydrates the aggregate from its event history
 * 3. Executes domain logic (update)
 * 4. Persists event to event store
 * 5. Publishes event to event bus for projection updates
 */

import { UpdateAudienceCommand } from "./UpdateAudienceCommand.js";
import { IAudienceUpdatedEventWriter } from "./IAudienceUpdatedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Audience } from "../../../../domain/audiences/Audience.js";
import { AudienceEvent } from "../../../../domain/audiences/EventIndex.js";
import { UUID } from "../../../../domain/BaseEvent.js";
import {
  AudienceErrorMessages,
  formatErrorMessage,
} from "../../../../domain/audiences/Constants.js";

export class UpdateAudienceCommandHandler {
  constructor(
    private readonly eventWriter: IAudienceUpdatedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: UpdateAudienceCommand): Promise<{ audienceId: UUID }> {
    // 1. Load aggregate event history from event store
    const history = await this.eventWriter.readStream(command.audienceId);

    // 2. Check if audience exists
    if (history.length === 0) {
      throw new Error(
        formatErrorMessage(AudienceErrorMessages.NOT_FOUND_WITH_ID, {
          id: command.audienceId,
        }),
      );
    }

    // 3. Rehydrate aggregate from event history
    const audience = Audience.rehydrate(
      command.audienceId,
      history as AudienceEvent[], // Type assertion needed for event store abstraction
    );

    // 4. Domain logic produces event
    const event = audience.update(
      command.name,
      command.description,
      command.priority,
    );

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { audienceId: command.audienceId };
  }
}
