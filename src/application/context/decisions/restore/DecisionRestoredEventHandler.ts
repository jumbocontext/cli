import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { DecisionRestoredEvent } from "../../../../domain/decisions/restore/DecisionRestoredEvent.js";
import { IDecisionRestoredProjector } from "./IDecisionRestoredProjector.js";
import { RelationReactivationCascade } from "../../relations/reactivate/RelationReactivationCascade.js";
import { IRelationMaintenanceGoalRegistrar } from "../../relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { EntityType } from "../../../../domain/relations/Constants.js";

export class DecisionRestoredEventHandler implements IEventHandler {
  constructor(
    private readonly projector: IDecisionRestoredProjector,
    private readonly relationReactivationCascade: RelationReactivationCascade,
    private readonly relationMaintenanceGoalRegistrar: IRelationMaintenanceGoalRegistrar,
  ) {}

  async handle(event: BaseEvent): Promise<void> {
    const decisionRestoredEvent = event as DecisionRestoredEvent;
    await this.projector.applyDecisionRestored(decisionRestoredEvent);
    await this.relationReactivationCascade.execute(
      EntityType.DECISION,
      decisionRestoredEvent.aggregateId,
      `Automatically reactivated because decision ${decisionRestoredEvent.aggregateId} was restored: ${decisionRestoredEvent.payload.reason}`,
    );
    await this.relationMaintenanceGoalRegistrar.execute(
      EntityType.DECISION,
      decisionRestoredEvent.aggregateId,
      `decision was restored: ${decisionRestoredEvent.payload.reason}`,
    );
  }
}
