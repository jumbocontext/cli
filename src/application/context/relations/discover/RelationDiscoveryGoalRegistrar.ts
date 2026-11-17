import { EntityTypeValue } from "../../../../domain/relations/Constants.js";
import { ILogger } from "../../../logging/ILogger.js";
import { IGoalTitleReader } from "../../goals/IGoalTitleReader.js";
import { AddGoalCommandHandler } from "../../goals/add/AddGoalCommandHandler.js";
import { IRelationDiscoveryGoalRegistrar } from "./IRelationDiscoveryGoalRegistrar.js";

/**
 * Registers a relation-discovery goal when a new entity is created.
 * The goal directs a future session to search defined and refined goals
 * for valid relations to the entity and register them with Jumbo.
 *
 * Idempotent: skips registration if a goal with the same title already exists.
 */
export class RelationDiscoveryGoalRegistrar implements IRelationDiscoveryGoalRegistrar {
  constructor(
    private readonly goalTitleReader: IGoalTitleReader,
    private readonly addGoalCommandHandler: AddGoalCommandHandler,
    private readonly logger: ILogger,
  ) {}

  async execute(
    entityType: EntityTypeValue,
    entityId: string,
  ): Promise<string | null> {
    try {
      const title = `Discover relations for ${entityType} ${entityId}`;

      this.logger.debug("Checking for existing relation-discovery goal", {
        entityType,
        entityId,
        title,
      });

      const existingGoal = await this.goalTitleReader.findByTitle(title);
      if (existingGoal) {
        this.logger.info(
          "Relation-discovery goal already exists, skipping registration",
          {
            entityType,
            entityId,
            existingGoalId: existingGoal.goalId,
          },
        );
        return null;
      }

      const { goalId } = await this.addGoalCommandHandler.execute({
        title,
        objective: `Search defined and refined goals for valid relations to the newly created ${entityType} '${entityId}' and register those relations with Jumbo.`,
        successCriteria: [
          `All defined and refined goals have been checked for relevance to ${entityType} '${entityId}'`,
          `Valid relations between goals and the ${entityType} have been registered`,
        ],
      });

      this.logger.info("Relation-discovery goal registered", {
        entityType,
        entityId,
        goalId,
      });

      return goalId;
    } catch (error) {
      this.logger.error("Failed to register relation-discovery goal", error, {
        entityType,
        entityId,
      });
      return null;
    }
  }
}
