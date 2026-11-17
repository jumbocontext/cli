import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID, ISO8601 } from "../BaseEvent.js";
import { ComponentId } from "./ComponentId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  ComponentEvent,
  ComponentAddedEvent,
  ComponentUpdatedEvent,
  ComponentDeprecatedEvent,
  ComponentRemovedEvent,
  ComponentRenamedEvent,
  ComponentUndeprecatedEvent,
} from "./EventIndex.js";
import {
  ComponentEventType,
  ComponentStatus,
  ComponentStatusValue,
  ComponentTypeValue,
  ComponentErrorMessages,
} from "./Constants.js";
import { NAME_RULES } from "./rules/NameRules.js";
import { TYPE_RULES } from "./rules/TypeRules.js";
import { DESCRIPTION_RULES } from "./rules/DescriptionRules.js";
import { RESPONSIBILITY_RULES } from "./rules/ResponsibilityRules.js";
import { PATH_RULES } from "./rules/PathRules.js";
import { DEPRECATION_REASON_RULES } from "./rules/DeprecationReasonRules.js";

export interface ComponentState extends AggregateState {
  id: ComponentId;
  name: string;
  type: ComponentTypeValue;
  description: string;
  responsibility: string;
  path: string;
  status: ComponentStatusValue;
  deprecationReason: string | null;
  version: number;
}

export class Component extends BaseAggregate<ComponentState, ComponentEvent> {
  private constructor(state: ComponentState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: ComponentState, event: ComponentEvent): void {
    switch (event.type) {
      case ComponentEventType.ADDED: {
        const e = event as ComponentAddedEvent;
        state.name = e.payload.name;
        state.type = e.payload.type;
        state.description = e.payload.description;
        state.responsibility = e.payload.responsibility;
        state.path = e.payload.path;
        state.status = e.payload.status;
        state.version = e.version;
        break;
      }
      case ComponentEventType.UPDATED: {
        const e = event as ComponentUpdatedEvent;
        if (e.payload.description !== undefined)
          state.description = e.payload.description;
        if (e.payload.responsibility !== undefined)
          state.responsibility = e.payload.responsibility;
        if (e.payload.path !== undefined) state.path = e.payload.path;
        if (e.payload.type !== undefined) state.type = e.payload.type;
        state.version = e.version;
        break;
      }
      case ComponentEventType.DEPRECATED: {
        const e = event as ComponentDeprecatedEvent;
        state.status = e.payload.status;
        state.deprecationReason = e.payload.reason;
        state.version = e.version;
        break;
      }
      case ComponentEventType.REMOVED: {
        const e = event as ComponentRemovedEvent;
        state.status = e.payload.status;
        state.version = e.version;
        break;
      }
      case ComponentEventType.RENAMED: {
        const e = event as ComponentRenamedEvent;
        state.name = e.payload.name;
        state.version = e.version;
        break;
      }
      case ComponentEventType.UNDEPRECATED: {
        const e = event as ComponentUndeprecatedEvent;
        state.status = ComponentStatus.ACTIVE;
        state.deprecationReason = null;
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: ComponentId = ComponentId.create()): Component {
    const state: ComponentState = {
      id,
      name: "",
      type: "service" as ComponentTypeValue,
      description: "",
      responsibility: "",
      path: "",
      status: ComponentStatus.ACTIVE,
      deprecationReason: null,
      version: 0,
    };
    return new Component(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Component from event store.
   */
  static rehydrate(id: UUID, history: ComponentEvent[]): Component {
    const state: ComponentState = {
      id: ComponentId.fromLegacy(id),
      name: "",
      type: "service" as ComponentTypeValue,
      description: "",
      responsibility: "",
      path: "",
      status: ComponentStatus.ACTIVE,
      deprecationReason: null,
      version: 0,
    };

    for (const event of history) {
      Component.apply(state, event);
    }

    return new Component(state);
  }

  add(
    name: string,
    type: ComponentTypeValue,
    description: string,
    responsibility: string,
    path: string,
  ): ComponentAddedEvent {
    // Validation using rule pattern
    ValidationRuleSet.ensure(name, NAME_RULES);
    ValidationRuleSet.ensure(type, TYPE_RULES);
    ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    ValidationRuleSet.ensure(responsibility, RESPONSIBILITY_RULES);
    ValidationRuleSet.ensure(path, PATH_RULES);

    return this.makeEvent<ComponentAddedEvent>(
      ComponentEventType.ADDED,
      {
        name,
        type,
        description,
        responsibility,
        path,
        status: ComponentStatus.ACTIVE,
      },
      Component.apply,
    );
  }

  update(
    description?: string,
    responsibility?: string,
    path?: string,
    type?: ComponentTypeValue,
  ): ComponentUpdatedEvent {
    if (this.state.status === ComponentStatus.REMOVED) {
      throw new Error(ComponentErrorMessages.ALREADY_REMOVED);
    }

    // At least one field must be provided
    if (!description && !responsibility && !path && !type) {
      throw new Error(ComponentErrorMessages.NO_FIELDS_TO_UPDATE);
    }

    // Validate changed fields
    if (description !== undefined)
      ValidationRuleSet.ensure(description, DESCRIPTION_RULES);
    if (responsibility !== undefined)
      ValidationRuleSet.ensure(responsibility, RESPONSIBILITY_RULES);
    if (path !== undefined) ValidationRuleSet.ensure(path, PATH_RULES);
    if (type !== undefined) ValidationRuleSet.ensure(type, TYPE_RULES);

    return this.makeEvent<ComponentUpdatedEvent>(
      ComponentEventType.UPDATED,
      {
        description,
        responsibility,
        path,
        type,
      },
      Component.apply,
    );
  }

  rename(name: string): ComponentRenamedEvent {
    if (this.state.status === ComponentStatus.REMOVED) {
      throw new Error(ComponentErrorMessages.ALREADY_REMOVED);
    }

    // Validate new name
    ValidationRuleSet.ensure(name, NAME_RULES);

    // Ensure name is actually different
    if (name === this.state.name) {
      throw new Error(ComponentErrorMessages.SAME_NAME);
    }

    return this.makeEvent<ComponentRenamedEvent>(
      ComponentEventType.RENAMED,
      { name },
      Component.apply,
    );
  }

  deprecate(reason?: string): ComponentDeprecatedEvent {
    // State validation
    if (this.state.status === ComponentStatus.REMOVED) {
      throw new Error(ComponentErrorMessages.ALREADY_REMOVED);
    }

    // Note: Allow deprecating already deprecated components (idempotent - updates reason)

    // Input validation
    if (reason) {
      ValidationRuleSet.ensure(reason, DEPRECATION_REASON_RULES);
    }

    return this.makeEvent<ComponentDeprecatedEvent>(
      ComponentEventType.DEPRECATED,
      {
        reason: reason || null,
        status: ComponentStatus.DEPRECATED,
      },
      Component.apply,
    );
  }

  remove(): ComponentRemovedEvent {
    if (this.state.status !== ComponentStatus.DEPRECATED) {
      throw new Error(ComponentErrorMessages.NOT_DEPRECATED);
    }

    return this.makeEvent<ComponentRemovedEvent>(
      ComponentEventType.REMOVED,
      {
        status: ComponentStatus.REMOVED,
      },
      Component.apply,
    );
  }

  undeprecate(reason: string): ComponentUndeprecatedEvent {
    if (this.state.status === ComponentStatus.ACTIVE) {
      throw new Error(ComponentErrorMessages.ALREADY_ACTIVE);
    }
    if (this.state.status === ComponentStatus.REMOVED) {
      throw new Error(ComponentErrorMessages.CANNOT_UNDEPRECATE_REMOVED);
    }

    ValidationRuleSet.ensure(reason, DEPRECATION_REASON_RULES);

    return this.makeEvent<ComponentUndeprecatedEvent>(
      ComponentEventType.UNDEPRECATED,
      {
        reason: reason.trim(),
        undeprecatedAt: new Date().toISOString() as ISO8601,
      },
      Component.apply,
    );
  }
}
