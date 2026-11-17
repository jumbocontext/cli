import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

/**
 * Abstraction for the relation maintenance goal registration side-effect.
 * When an entity changes, implementations check for active relations and
 * optionally register a goal to review them.
 */
export interface IRelationMaintenanceGoalRegistrar {
  execute(
    entityType: EntityTypeValue,
    entityId: string,
    changeDescription: string,
  ): Promise<string | null>;
}
