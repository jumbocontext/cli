import { RemoveRelationCommand } from "./RemoveRelationCommand.js";
import { IRelationRemovedEventWriter } from "./IRelationRemovedEventWriter.js";
import { IRelationRemovedEventReader } from "./IRelationRemovedEventReader.js";
import { IRelationRemovedReader } from "./IRelationRemovedReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Relation } from "../../../../domain/relations/Relation.js";
import { RelationEvent } from "../../../../domain/relations/EventIndex.js";
import {
  RelationErrorMessages,
  formatErrorMessage,
} from "../../../../domain/relations/Constants.js";
import { ValidationRuleSet } from "../../../../domain/validation/ValidationRule.js";
import { RELATION_ID_RULES } from "../../../../domain/relations/rules/RelationIdRules.js";

/**
 * Handles removing an existing relation.
 * Rehydrates the relation aggregate, produces RelationRemoved event, persists and publishes.
 */
export class RemoveRelationCommandHandler {
  constructor(
    private readonly eventWriter: IRelationRemovedEventWriter,
    private readonly eventReader: IRelationRemovedEventReader,
    private readonly eventBus: IEventBus,
    private readonly reader: IRelationRemovedReader,
  ) {}

  async execute(command: RemoveRelationCommand): Promise<void> {
    // Validate input
    ValidationRuleSet.ensure(command.relationId, RELATION_ID_RULES);

    // Check if relation exists (precondition)
    const existingRelation = await this.reader.findById(command.relationId);
    if (!existingRelation) {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_NOT_FOUND, {
          relationId: command.relationId,
        }),
      );
    }

    // Check if already removed
    if (existingRelation.status === "removed") {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_ALREADY_REMOVED, {
          relationId: command.relationId,
        }),
      );
    }

    // Rehydrate aggregate from event history
    const history = await this.eventReader.readStream(command.relationId);
    const relation = Relation.rehydrate(
      command.relationId,
      history as RelationEvent[],
    );

    // Domain logic produces event
    const event = relation.remove(command.reason);

    // Persist event to file store
    await this.eventWriter.append(event);

    // Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);
  }
}
