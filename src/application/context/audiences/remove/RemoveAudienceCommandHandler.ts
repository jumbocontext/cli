/**
 * RemoveAudienceCommandHandler - Command handler for audience removal.
 *
 * This handler:
 * 1. Rehydrates the Audience aggregate from event history
 * 2. Executes domain logic (remove)
 * 3. Persists event to event store
 * 4. Publishes event to event bus for projection updates
 */

import { RemoveAudienceCommand } from "./RemoveAudienceCommand.js";
import { IAudienceRemovedEventWriter } from "./IAudienceRemovedEventWriter.js";
import { IAudienceRemoveReader } from "./IAudienceRemoveReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Audience } from "../../../../domain/audiences/Audience.js";
import { AudienceEvent } from "../../../../domain/audiences/EventIndex.js";
import {
  AudienceErrorMessages,
  formatErrorMessage,
} from "../../../../domain/audiences/Constants.js";

export class RemoveAudienceCommandHandler {
  constructor(
    private readonly eventWriter: IAudienceRemovedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IAudienceRemoveReader,
  ) {}

  async execute(
    command: RemoveAudienceCommand,
  ): Promise<{ audienceId: string }> {
    // 1. Check preconditions - audience must exist
    const existingView = await this.reader.findById(command.audienceId);
    if (!existingView) {
      throw new Error(
        formatErrorMessage(AudienceErrorMessages.NOT_FOUND_WITH_ID, {
          id: command.audienceId,
        }),
      );
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventWriter.readStream(command.audienceId);
    const audience = Audience.rehydrate(
      command.audienceId,
      history as AudienceEvent[],
    );

    // 3. Domain logic produces event (validates not already removed)
    const event = audience.remove(command.reason);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { audienceId: command.audienceId };
  }
}
