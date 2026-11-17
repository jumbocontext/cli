import { UpdateDecisionCommand } from "./UpdateDecisionCommand.js";
import { IDecisionUpdatedEventWriter } from "./IDecisionUpdatedEventWriter.js";
import { IDecisionUpdateReader } from "./IDecisionUpdateReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Decision } from "../../../../domain/decisions/Decision.js";
import { DecisionEvent } from "../../../../domain/decisions/EventIndex.js";

/**
 * Application layer handler for updating existing decisions.
 *
 * Implements the event sourcing pattern for updates:
 * 1. Check existence via projection (fast query)
 * 2. Rehydrate aggregate from event stream (rebuild full state)
 * 3. Execute domain logic (validation + business rules)
 * 4. Persist new event
 * 5. Publish for projection updates
 */
export class UpdateDecisionCommandHandler {
  constructor(
    private readonly eventWriter: IDecisionUpdatedEventWriter,
    private readonly reader: IDecisionUpdateReader,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * Execute the update decision command.
   *
   * @param command - The update decision command
   * @returns The decision ID
   * @throws Error if decision not found or validation fails
   */
  async execute(
    command: UpdateDecisionCommand,
  ): Promise<{ decisionId: string }> {
    // 1. Check precondition: decision must exist
    const existingView = await this.reader.findById(command.decisionId);
    if (!existingView) {
      throw new Error(`Decision not found: ${command.decisionId}`);
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventWriter.readStream(command.decisionId);
    const decision = Decision.rehydrate(
      command.decisionId,
      history as DecisionEvent[],
    );

    // 3. Domain logic produces event
    const event = decision.update(
      command.title,
      command.context,
      command.rationale,
      command.alternatives,
      command.consequences,
    );

    // 4. Persist event to file store
    await this.eventWriter.append(event);

    // 5. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { decisionId: command.decisionId };
  }
}
