import type { DecisionRemovedEvent } from "../../../../domain/decisions/remove/DecisionRemovedEvent.js";

export interface IDecisionRemovedProjector {
  applyDecisionRemoved(event: DecisionRemovedEvent): Promise<void>;
}
