import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { AddGoalCommandHandler } from "../../goals/add/AddGoalCommandHandler.js";
import { IRelationMaintenanceGoalRegistrar } from "./IRelationMaintenanceGoalRegistrar.js";

/**
 * Shared application service that registers a maintenance goal when an entity
 * with active relations is changed. The goal objective directs the agent to
 * verify and update those relations so they remain in symmetry with the entity.
 */
export class RelationMaintenanceGoalRegistrar implements IRelationMaintenanceGoalRegistrar {
  constructor(
    private readonly relationViewReader: IRelationViewReader,
    private readonly addGoalCommandHandler: AddGoalCommandHandler,
  ) {}

  async execute(
    entityType: EntityTypeValue,
    entityId: string,
    changeDescription: string,
  ): Promise<string | null> {
    try {
      const activeRelations = await this.relationViewReader.findAll({
        entityType,
        entityId,
        status: "active",
      });

      if (activeRelations.length === 0) {
        return null;
      }

      const relatedEntities = activeRelations.map((r) => {
        const isFrom =
          r.fromEntityType === entityType && r.fromEntityId === entityId;
        return `${isFrom ? r.toEntityType : r.fromEntityType}:${isFrom ? r.toEntityId : r.fromEntityId}`;
      });

      const { goalId } = await this.addGoalCommandHandler.execute({
        title: `Update relations for ${entityType} ${entityId}`,
        objective: `The ${entityType} '${entityId}' was changed: ${changeDescription}. Review and update its ${activeRelations.length} active relation(s) to ensure they accurately reflect the current state of the entity. Related entities: ${relatedEntities.join(", ")}.`,
        successCriteria: [
          `Symmetry between the updated ${entityType} and its relations is verified or restored`,
        ],
      });

      return goalId;
    } catch {
      return null;
    }
  }
}
