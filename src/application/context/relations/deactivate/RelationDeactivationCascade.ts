import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { DeactivateRelationCommandHandler } from "./DeactivateRelationCommandHandler.js";

/**
 * Shared application service for cascading relation deactivation when an entity reaches terminal status.
 */
export class RelationDeactivationCascade {
  constructor(
    private readonly relationViewReader: IRelationViewReader,
    private readonly deactivateRelationCommandHandler: DeactivateRelationCommandHandler,
  ) {}

  async execute(
    entityType: EntityTypeValue,
    entityId: string,
    reason: string,
  ): Promise<number> {
    const activeRelations = await this.relationViewReader.findAll({
      entityType,
      entityId,
      status: "active",
    });

    await Promise.all(
      activeRelations.map((relation) =>
        this.deactivateRelationCommandHandler.execute({
          relationId: relation.relationId,
          reason,
        }),
      ),
    );

    return activeRelations.length;
  }
}
