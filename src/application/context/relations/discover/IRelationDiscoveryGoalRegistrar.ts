import { EntityTypeValue } from "../../../../domain/relations/Constants.js";

/**
 * Abstraction for the relation discovery goal registration side-effect.
 * When a new entity is created, implementations register a goal to search
 * defined and refined goals for valid relations to the new entity.
 */
export interface IRelationDiscoveryGoalRegistrar {
  execute(
    entityType: EntityTypeValue,
    entityId: string,
  ): Promise<string | null>;
}
