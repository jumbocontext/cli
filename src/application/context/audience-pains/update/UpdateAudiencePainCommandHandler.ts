/**
 * UpdateAudiencePainCommandHandler - Command handler for audience pain update.
 *
 * This handler:
 * 1. Checks if the pain exists
 * 2. Rehydrates aggregate from event history
 * 3. Executes domain logic (update)
 * 4. Persists event to event store
 * 5. Publishes event to event bus for projection updates
 */

import { UpdateAudiencePainCommand } from "./UpdateAudiencePainCommand.js";
import { IAudiencePainUpdatedEventWriter } from "./IAudiencePainUpdatedEventWriter.js";
import { IAudiencePainUpdateReader } from "./IAudiencePainUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { AudiencePain } from "../../../../domain/audience-pains/AudiencePain.js";
import { AudiencePainErrorMessages } from "../../../../domain/audience-pains/Constants.js";
import { AudiencePainEvent } from "../../../../domain/audience-pains/EventIndex.js";

export class UpdateAudiencePainCommandHandler {
  constructor(
    private readonly eventWriter: IAudiencePainUpdatedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IAudiencePainUpdateReader,
  ) {}

  async execute(
    command: UpdateAudiencePainCommand,
  ): Promise<{ painId: string }> {
    // 1. Check if pain exists
    const existingPain = await this.reader.findById(command.painId);
    if (!existingPain) {
      throw new Error(AudiencePainErrorMessages.NOT_FOUND);
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventWriter.readStream(command.painId);
    const pain = AudiencePain.rehydrate(
      command.painId,
      history as AudiencePainEvent[],
    );

    // 3. Domain logic produces event
    const event = pain.update(command.title, command.description);

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections update via subscriptions)
    await this.eventBus.publish(event);

    return { painId: command.painId };
  }
}
