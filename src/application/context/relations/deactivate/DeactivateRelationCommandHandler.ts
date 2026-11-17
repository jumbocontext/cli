import { IEventBus } from "../../../messaging/IEventBus.js";
import { Relation } from "../../../../domain/relations/Relation.js";
import { RelationEvent } from "../../../../domain/relations/EventIndex.js";
import {
  RelationErrorMessages,
  formatErrorMessage,
} from "../../../../domain/relations/Constants.js";
import { ValidationRuleSet } from "../../../../domain/validation/ValidationRule.js";
import { RELATION_ID_RULES } from "../../../../domain/relations/rules/RelationIdRules.js";
import { DeactivateRelationCommand } from "./DeactivateRelationCommand.js";
import { IRelationDeactivatedEventWriter } from "./IRelationDeactivatedEventWriter.js";
import { IRelationDeactivatedEventReader } from "./IRelationDeactivatedEventReader.js";
import { IRelationDeactivatedReader } from "./IRelationDeactivatedReader.js";

export class DeactivateRelationCommandHandler {
  constructor(
    private readonly eventWriter: IRelationDeactivatedEventWriter,
    private readonly eventReader: IRelationDeactivatedEventReader,
    private readonly eventBus: IEventBus,
    private readonly reader: IRelationDeactivatedReader,
  ) {}

  async execute(command: DeactivateRelationCommand): Promise<void> {
    ValidationRuleSet.ensure(command.relationId, RELATION_ID_RULES);

    const existingRelation = await this.reader.findById(command.relationId);
    if (!existingRelation) {
      throw new Error(
        formatErrorMessage(RelationErrorMessages.RELATION_NOT_FOUND, {
          relationId: command.relationId,
        }),
      );
    }

    if (
      existingRelation.status === "deactivated" ||
      existingRelation.status === "removed"
    ) {
      return;
    }

    const history = await this.eventReader.readStream(command.relationId);
    const relation = Relation.rehydrate(
      command.relationId,
      history as RelationEvent[],
    );

    // The projection may be stale during event replay (evolve). The rehydrated
    // aggregate is authoritative — skip if already deactivated or removed.
    if (relation.snapshot.status !== "active") {
      return;
    }

    const event = relation.deactivate(command.reason);

    await this.eventWriter.append(event);
    await this.eventBus.publish(event);
  }
}
