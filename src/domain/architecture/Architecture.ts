import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  ArchitectureEvent,
  ArchitectureDefinedEvent,
  ArchitectureUpdatedEvent,
  ArchitectureDeprecatedEvent,
  DataStore,
} from "./EventIndex.js";
import {
  ArchitectureEventType,
  ArchitectureErrorMessages,
} from "./Constants.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";
import { ORGANIZATION_RULES } from "./rules/OrganizationRules.js";
import { PATTERNS_RULES } from "./rules/PatternsRules.js";
import { PRINCIPLES_RULES } from "./rules/PrinciplesRules.js";
import { DATA_STORES_RULES } from "./rules/DataStoresRules.js";
import { STACK_RULES } from "./rules/StackRules.js";

// Domain state: business properties + aggregate metadata
export interface ArchitectureState extends AggregateState {
  id: UUID; // Aggregate identity
  description: string; // Required: high-level overview
  organization: string; // Required: architectural organization
  patterns: string[]; // Optional: architectural patterns
  principles: string[]; // Optional: design principles
  dataStores: DataStore[]; // Optional: data stores
  stack: string[]; // Optional: technology stack
  deprecated: boolean; // Whether the architecture entity is deprecated
  version: number; // Aggregate version
}

export class Architecture extends BaseAggregate<
  ArchitectureState,
  ArchitectureEvent
> {
  private constructor(state: ArchitectureState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: ArchitectureState, event: ArchitectureEvent): void {
    switch (event.type) {
      case ArchitectureEventType.DEFINED: {
        const e = event as ArchitectureDefinedEvent;
        state.description = e.payload.description;
        state.organization = e.payload.organization;
        state.patterns = e.payload.patterns;
        state.principles = e.payload.principles;
        state.dataStores = e.payload.dataStores;
        state.stack = e.payload.stack;
        state.version = e.version;
        break;
      }
      case ArchitectureEventType.UPDATED: {
        const e = event as ArchitectureUpdatedEvent;
        if (e.payload.description !== undefined)
          state.description = e.payload.description;
        if (e.payload.organization !== undefined)
          state.organization = e.payload.organization;
        if (e.payload.patterns !== undefined)
          state.patterns = e.payload.patterns;
        if (e.payload.principles !== undefined)
          state.principles = e.payload.principles;
        if (e.payload.dataStores !== undefined)
          state.dataStores = e.payload.dataStores;
        if (e.payload.stack !== undefined) state.stack = e.payload.stack;
        state.version = e.version;
        break;
      }
      case ArchitectureEventType.DEPRECATED: {
        state.deprecated = true;
        state.version = event.version;
        break;
      }
    }
  }

  static create(id: UUID): Architecture {
    const state: ArchitectureState = {
      id,
      description: "",
      organization: "",
      patterns: [],
      principles: [],
      dataStores: [],
      stack: [],
      deprecated: false,
      version: 0,
    };
    return new Architecture(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Architecture from event store.
   */
  static rehydrate(id: UUID, history: ArchitectureEvent[]): Architecture {
    const state: ArchitectureState = {
      id,
      description: "",
      organization: "",
      patterns: [],
      principles: [],
      dataStores: [],
      stack: [],
      deprecated: false,
      version: 0,
    };

    for (const event of history) {
      Architecture.apply(state, event);
    }

    return new Architecture(state);
  }

  /**
   * Define the architecture.
   * This is the initial event that creates the architecture aggregate.
   */
  define(
    description: string,
    organization: string,
    patterns?: string[],
    principles?: string[],
    dataStores?: DataStore[],
    stack?: string[],
  ): ArchitectureDefinedEvent {
    if (this.state.version > 0) {
      throw new Error(ArchitectureErrorMessages.ALREADY_DEFINED);
    }

    // Validation using rule pattern
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    ValidationRuleSet.ensure(organization, ORGANIZATION_RULES);
    if (patterns && patterns.length > 0)
      ValidationRuleSet.ensure(patterns, PATTERNS_RULES);
    if (principles && principles.length > 0)
      ValidationRuleSet.ensure(principles, PRINCIPLES_RULES);
    if (dataStores && dataStores.length > 0)
      ValidationRuleSet.ensure(dataStores, DATA_STORES_RULES);
    if (stack && stack.length > 0) ValidationRuleSet.ensure(stack, STACK_RULES);

    // Use BaseAggregate.makeEvent
    return this.makeEvent(
      ArchitectureEventType.DEFINED,
      {
        description,
        organization,
        patterns: patterns || [],
        principles: principles || [],
        dataStores: dataStores || [],
        stack: stack || [],
      },
      Architecture.apply,
    ) as ArchitectureDefinedEvent;
  }

  /**
   * Updates architecture with partial changes.
   * Undefined fields = no change, null = clear value, defined = set value.
   */
  update(updates: {
    description?: string;
    organization?: string;
    patterns?: string[];
    principles?: string[];
    dataStores?: DataStore[];
    stack?: string[];
  }): ArchitectureUpdatedEvent {
    // Precondition: must be defined first
    if (this.state.version === 0) {
      throw new Error(ArchitectureErrorMessages.NOT_DEFINED);
    }

    // Precondition: must not be deprecated
    if (this.state.deprecated) {
      throw new Error(ArchitectureErrorMessages.DEPRECATED);
    }

    // Validate provided fields
    if (updates.description !== undefined) {
      ValidationRuleSet.ensure(updates.description, DESCRIPTION_RULES);
    }
    if (updates.organization !== undefined) {
      ValidationRuleSet.ensure(updates.organization, ORGANIZATION_RULES);
    }
    if (updates.patterns !== undefined && updates.patterns.length > 0) {
      ValidationRuleSet.ensure(updates.patterns, PATTERNS_RULES);
    }
    if (updates.principles !== undefined && updates.principles.length > 0) {
      ValidationRuleSet.ensure(updates.principles, PRINCIPLES_RULES);
    }
    if (updates.dataStores !== undefined && updates.dataStores.length > 0) {
      ValidationRuleSet.ensure(updates.dataStores, DATA_STORES_RULES);
    }
    if (updates.stack !== undefined && updates.stack.length > 0) {
      ValidationRuleSet.ensure(updates.stack, STACK_RULES);
    }

    // Create event with only provided updates
    return this.makeEvent(
      ArchitectureEventType.UPDATED,
      updates,
      Architecture.apply,
    ) as ArchitectureUpdatedEvent;
  }

  /**
   * Deprecate the architecture entity.
   * Once deprecated, define and update operations are no longer permitted.
   */
  deprecate(reason: string): ArchitectureDeprecatedEvent {
    if (this.state.version === 0) {
      throw new Error(ArchitectureErrorMessages.NOT_DEFINED);
    }
    if (this.state.deprecated) {
      throw new Error(ArchitectureErrorMessages.ALREADY_DEPRECATED);
    }

    return this.makeEvent(
      ArchitectureEventType.DEPRECATED,
      { reason },
      Architecture.apply,
    ) as ArchitectureDeprecatedEvent;
  }
}
