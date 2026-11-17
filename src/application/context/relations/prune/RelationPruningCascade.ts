import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { IRelationViewReader } from "../get/IRelationViewReader.js";
import { RemoveRelationCommandHandler } from "../remove/RemoveRelationCommandHandler.js";

/**
 * Shared application service for pruning relations when an entity is irreversibly removed.
 */
export class RelationPruningCascade {
  constructor(
    private readonly relationViewReader: IRelationViewReader,
    private readonly removeRelationCommandHandler: RemoveRelationCommandHandler,
  ) {}

  async execute(
    entityType: EntityTypeValue,
    entityId: string,
    reason: string,
  ): Promise<number> {
    const relations = await this.relationViewReader.findAll({
      entityType,
      entityId,
      status: "all",
    });
    const relationsToPrune = relations.filter(
      (relation) => relation.status !== "removed",
    );

    await Promise.all(
      relationsToPrune.map((relation) =>
        this.removeRelationCommandHandler.execute({
          relationId: relation.relationId,
          reason,
        }),
      ),
    );

    return relationsToPrune.length;
  }
}
