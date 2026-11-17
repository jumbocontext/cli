import { AddDecisionCommand } from "./AddDecisionCommand.js";
import { IDecisionAddedEventWriter } from "./IDecisionAddedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Decision } from "../../../../domain/decisions/Decision.js";
import { DecisionAddedEvent } from "../../../../domain/decisions/add/DecisionAddedEvent.js";

/**
 * Application layer handler for the AddDecision command.
 * Orchestrates the decision creation workflow.
 */
export class AddDecisionCommandHandler {
  constructor(
    private readonly eventWriter: IDecisionAddedEventWriter,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: AddDecisionCommand): Promise<{ decisionId: string }> {
    // 1. Create new aggregate with unique ID
    const decision = Decision.create();
    const decisionId = decision.snapshot.id;

    // 2. Domain logic produces event
    const event = decision.add(
      command.title,
      command.context,
      command.rationale,
      command.alternatives,
      command.consequences,
    ) as DecisionAddedEvent;

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { decisionId };
  }
}
