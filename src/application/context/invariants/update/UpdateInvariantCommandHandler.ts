/**
 * UpdateInvariantCommandHandler - Command handler for updating invariants.
 *
 * This handler:
 * 1. Loads aggregate from event store (rehydration)
 * 2. Executes domain logic (update)
 * 3. Persists event to event store
 * 4. Publishes event to event bus for projection updates
 */

import { UpdateInvariantCommand } from "./UpdateInvariantCommand.js";
import { IInvariantUpdatedEventWriter } from "./IInvariantUpdatedEventWriter.js";
import { IInvariantUpdatedEventReader } from "./IInvariantUpdatedEventReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Invariant } from "../../../../domain/invariants/Invariant.js";
import { InvariantEvent } from "../../../../domain/invariants/EventIndex.js";
import { InvariantErrorMessages } from "../../../../domain/invariants/Constants.js";

export class UpdateInvariantCommandHandler {
  constructor(
    private readonly eventWriter: IInvariantUpdatedEventWriter,
    private readonly eventReader: IInvariantUpdatedEventReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: UpdateInvariantCommand,
  ): Promise<{ invariantId: string }> {
    // 1. Load aggregate from event store
    const history = await this.eventReader.readStream(command.invariantId);
    if (history.length === 0) {
      throw new Error(InvariantErrorMessages.NOT_FOUND);
    }

    // 2. Rehydrate aggregate from events
    const invariant = Invariant.rehydrate(
      command.invariantId,
      history as InvariantEvent[],
    );

    // 3. Domain logic produces event
    const event = invariant.update({
      title: command.title,
      description: command.description,
      rationale: command.rationale,
    });

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { invariantId: command.invariantId };
  }
}
