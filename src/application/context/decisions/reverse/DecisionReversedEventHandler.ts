import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DecisionReversedEvent } from "../../../../domain/decisions/reverse/DecisionReversedEvent.js";
import { IDecisionReversedProjector } from "./IDecisionReversedProjector.js";
import { RelationDeactivationCascade } from "../../relations/deactivate/RelationDeactivationCascade.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

/**
 * Application layer handler that orchestrates projection updates for DecisionReversed events.
 * Subscribes to events via event bus.
 */
export class DecisionReversedEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IDecisionReversedProjector,
    private readonly relationDeactivationCascade: RelationDeactivationCascade,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionReversedEvent = event as DecisionReversedEvent;
    await this.projector.applyDecisionReversed(decisionReversedEvent);
    await this.relationDeactivationCascade.execute(
      EntityType.DECISION,
      decisionReversedEvent.aggregateId,
      `Automatically deactivated because decision ${decisionReversedEvent.aggregateId} was reversed: ${decisionReversedEvent.payload.reason}`,
    );
  }
}
