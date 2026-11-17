/**
 * AddAudiencePainCommandHandler - Command handler for audience pain addition.
 *
 * This handler:
 * 1. Creates a new AudiencePain aggregate with unique ID
 * 2. Executes domain logic (add)
 * 3. Persists event to event store
 * 4. Publishes event to event bus for projection updates
 */

import { AddAudiencePainCommand } from "./AddAudiencePainCommand.js";
import { IAudiencePainAddedEventWriter } from "./IAudiencePainAddedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { AudiencePain } from "../../../../domain/audience-pains/AudiencePain.js";

export class AddAudiencePainCommandHandler {
  constructor(
    private readonly eventWriter: IAudiencePainAddedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: AddAudiencePainCommand): Promise<{ painId: string }> {
    // 1. Create new aggregate
    const pain = AudiencePain.create();
    const painId = pain.snapshot.id;

    // 2. Domain logic produces event
    const event = pain.add(command.title, command.description);

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { painId };
  }
}
