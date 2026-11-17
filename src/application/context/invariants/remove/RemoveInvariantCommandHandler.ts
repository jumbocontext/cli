/**
 * RemoveInvariantCommandHandler - Command handler for removing invariants.
 *
 * Orchestrates the removal of an invariant from project knowledge.
 * Verifies existence, rehydrates aggregate, executes domain logic, and publishes event.
 */

import { RemoveInvariantCommand } from "./RemoveInvariantCommand.js";
import { IInvariantRemovedEventWriter } from "./IInvariantRemovedEventWriter.js";
import { IInvariantRemovedEventReader } from "./IInvariantRemovedEventReader.js";
import { IInvariantRemoveReader } from "./IInvariantRemoveReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Invariant } from "../../../../domain/invariants/Invariant.js";
import { InvariantEvent } from "../../../../domain/invariants/EventIndex.js";
import { InvariantErrorMessages } from "../../../../domain/invariants/Constants.js";

export class RemoveInvariantCommandHandler {
  constructor(
    private readonly eventWriter: IInvariantRemovedEventWriter,
    private readonly eventReader: IInvariantRemovedEventReader,
    private readonly invariantReader: IInvariantRemoveReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: RemoveInvariantCommand): Promise<void> {
    // 1. Check if invariant exists
    const existingView = await this.invariantReader.findById(
      command.invariantId,
    );
    if (!existingView) {
      throw new Error(InvariantErrorMessages.NOT_FOUND);
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventReader.readStream(command.invariantId);
    const invariant = Invariant.rehydrate(
      command.invariantId,
      history as InvariantEvent[],
    );

    // 3. Domain logic produces removal event
    const event = invariant.remove();

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);
  }
}
