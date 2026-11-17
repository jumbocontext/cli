/**
 * AddAudienceCommandHandler - Command handler for audience addition.
 *
 * This handler:
 * 1. Creates a new Audience aggregate with unique ID
 * 2. Executes domain logic (add)
 * 3. Persists event to event store
 * 4. Publishes event to event bus for projection updates
 */

import { AddAudienceCommand } from "./AddAudienceCommand.js";
import { IAudienceAddedEventWriter } from "./IAudienceAddedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Audience } from "../../../../domain/audiences/Audience.js";

export class AddAudienceCommandHandler {
  constructor(
    private readonly eventWriter: IAudienceAddedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: AddAudienceCommand): Promise<{ audienceId: string }> {
    // 1. Create new aggregate
    const audience = Audience.create();
    const audienceId = audience.snapshot.id;

    // 2. Domain logic produces event
    const event = audience.add(
      command.name,
      command.description,
      command.priority,
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { audienceId };
  }
}
