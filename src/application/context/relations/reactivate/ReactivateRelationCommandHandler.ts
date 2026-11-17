import { IEventBus } from "../../../messaging/IEventBus.js";
import { Relation } from "../../../../domain/relations/Relation.js";
import { RelationEvent } from "../../../../domain/relations/EventIndex.js";
import {
  RelationErrorMessages,
  formatErrorMessage,
} from "../../../../domain/relations/Constants.js";
import { ValidationRuleSet } from "../../../../domain/validation/ValidationRule.js";
import { RELATION_ID_RULES } from "../../../../domain/relations/rules/RelationIdRules.js";
import { ReactivateRelationCommand } from "./ReactivateRelationCommand.js";
import { IRelationReactivatedEventWriter } from "./IRelationReactivatedEventWriter.js";
import { IRelationReactivatedEventReader } from "./IRelationReactivatedEventReader.js";
import { IRelationReactivatedReader } from "./IRelationReactivatedReader.js";

export class ReactivateRelationCommandHandler {
  constructor(
    private readonly eventWriter: IRelationReactivatedEventWriter,
    private readonly eventReader: IRelationReactivatedEventReader,
    private readonly eventBus: IEventBus,
    private readonly reader: IRelationReactivatedReader,
  ) {}

  async execute(command: ReactivateRelationCommand): Promise<void> {
    ValidationRuleSet.ensure(command.relationId, RELATION_ID_RULES);

    const existingRelation = await this.reader.findById(command.relationId);
    if (!existingRelation) {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_NOT_FOUND, {
          relationId: command.relationId,
        }),
      );
    }

    const history = await this.eventReader.readStream(command.relationId);
    const relation = Relation.rehydrate(
      command.relationId,
      history as RelationEvent[],
    );
    const event = relation.reactivate(command.reason);

    await this.eventWriter.append(event);
    await this.eventBus.publish(event);
  }
}
