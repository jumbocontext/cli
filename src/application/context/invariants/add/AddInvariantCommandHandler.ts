/**
 * AddInvariantCommandHandler - Command handler for adding invariants.
 *
 * This handler:
 * 1. Validates preconditions (no duplicate title)
 * 2. Creates the Invariant aggregate
 * 3. Executes domain logic (add)
 * 4. Persists event to event store
 * 5. Publishes event to event bus for projection updates
 */

import { AddInvariantCommand } from "./AddInvariantCommand.js";
import { IInvariantAddedEventWriter } from "./IInvariantAddedEventWriter.js";
import { IInvariantAddReader } from "./IInvariantAddReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Invariant } from "../../../../domain/invariants/Invariant.js";

export class AddInvariantCommandHandler {
  constructor(
    private readonly eventWriter: IInvariantAddedEventWriter,
    private readonly invariantReader: IInvariantAddReader,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: AddInvariantCommand,
  ): Promise<{ invariantId: string }> {
    // Check for duplicate title (idempotency)
    const existing = await this.invariantReader.findByTitle(command.title);
    if (existing) {
      throw new Error(`Invariant with title "${command.title}" already exists`);
    }

    // 1. Create new aggregate
    const invariant = Invariant.create();
    const invariantId = invariant.snapshot.id;

    // 2. Domain logic produces event
    const event = invariant.add(
      command.title,
      command.description,
      command.rationale,
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { invariantId };
  }
}
