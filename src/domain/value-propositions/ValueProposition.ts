import { BaseAggregate } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { ValuePropositionId } from "./ValuePropositionId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import { ValuePropositionAddedEvent } from "./add/ValuePropositionAddedEvent.js";
import { ValuePropositionUpdatedEvent } from "./update/ValuePropositionUpdatedEvent.js";
import { ValuePropositionRemovedEvent } from "./remove/ValuePropositionRemovedEvent.js";
import {
  ValuePropositionProjection,
  ValuePropositionState,
  ValuePropositionEvent,
} from "./ValuePropositionProjection.js";
import {
  ValuePropositionEventType,
  ValuePropositionErrorMessages,
} from "./Constants.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";
import { BENEFIT_RULES } from "./rules/BenefitRules.js";
import { MEASURABLE_OUTCOME_RULES } from "./rules/MeasurableOutcomeRules.js";

export class ValueProposition extends BaseAggregate<
  ValuePropositionState,
  ValuePropositionEvent
> {
  private constructor(state: ValuePropositionState) {
    super(state); // Call BaseAggregate constructor
  }

  static create(
    id: ValuePropositionId = ValuePropositionId.create(),
  ): ValueProposition {
    const state: ValuePropositionState = {
      id,
      title: "",
      description: "",
      benefit: "",
      measurableOutcome: null,
      version: 0,
    };
    return new ValueProposition(state);
  }

  static rehydrate(
    id: UUID,
    history: ValuePropositionEvent[],
  ): ValueProposition {
    const state = ValuePropositionProjection.rehydrate(
      ValuePropositionId.fromLegacy(id),
      history,
    );
    return new ValueProposition(state);
  }

  add(
    title: string,
    description: string,
    benefit: string,
    measurableOutcome?: string,
  ): ValuePropositionEvent {
    // Validation using rule pattern
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    ValidationRuleSet.ensure(benefit, BENEFIT_RULES);
    if (measurableOutcome) {
      ValidationRuleSet.ensure(measurableOutcome, MEASURABLE_OUTCOME_RULES);
    }

    // Use BaseAggregate.makeEvent (no need to reimplement!)
    return this.makeEvent<ValuePropositionAddedEvent>(
      ValuePropositionEventType.ADDED,
      {
        title,
        description,
        benefit,
        measurableOutcome: measurableOutcome || null,
      },
      ValuePropositionProjection.apply, // Pass projection's apply function
    );
  }

  update(
    title?: string,
    description?: string,
    benefit?: string,
    measurableOutcome?: string | null,
  ): ValuePropositionUpdatedEvent {
    // 1. Ensure at least one field is being updated
    if (
      title === undefined &&
      description === undefined &&
      benefit === undefined &&
      measurableOutcome === undefined
    ) {
      throw new Error(ValuePropositionErrorMessages.NO_CHANGES);
    }

    // 2. Validate provided fields using existing rules
    if (title !== undefined) {
      ValidationRuleSet.ensure(title, TITLE_RULES);
    }
    if (description !== undefined) {
      ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    }
    if (benefit !== undefined) {
      ValidationRuleSet.ensure(benefit, BENEFIT_RULES);
    }
    if (measurableOutcome !== undefined && measurableOutcome !== null) {
      ValidationRuleSet.ensure(measurableOutcome, MEASURABLE_OUTCOME_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent<ValuePropositionUpdatedEvent>(
      ValuePropositionEventType.UPDATED,
      {
        title,
        description,
        benefit,
        measurableOutcome,
      },
      ValuePropositionProjection.apply,
    );
  }

  remove(): ValuePropositionRemovedEvent {
    // No validation needed for removal
    // Use BaseAggregate.makeEvent with empty payload
    return this.makeEvent<ValuePropositionRemovedEvent>(
      ValuePropositionEventType.REMOVED,
      {}, // Empty payload as per event definition
      ValuePropositionProjection.apply,
    );
  }
}
