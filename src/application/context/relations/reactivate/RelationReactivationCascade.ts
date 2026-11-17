import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { ReactivateRelationCommandHandler } from "./ReactivateRelationCommandHandler.js";

/**
 * Shared application service for cascading relation reactivation when an entity is restored to active status.
 */
export class RelationReactivationCascade {
  constructor(
    private readonly relationViewReader: IRelationViewReader,
    private readonly reactivateRelationCommandHandler: ReactivateRelationCommandHandler,
  ) {}

  async execute(
    entityType: EntityTypeValue,
    entityId: string,
    reason: string,
  ): Promise<number> {
    const deactivatedRelations = await this.relationViewReader.findAll({
      entityType,
      entityId,
      status: "deactivated",
    });

    await Promise.all(
      deactivatedRelations.map((relation) =>
        this.reactivateRelationCommandHandler.execute({
          relationId: relation.relationId,
          reason,
        }),
      ),
    );

    return deactivatedRelations.length;
  }
}
