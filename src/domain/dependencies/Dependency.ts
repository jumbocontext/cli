import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { DependencyId } from "./DependencyId.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  DependencyEvent,
  DependencyAddedEvent,
  ExternalDependencyPayload,
  LegacyComponentDependencyPayload,
  DependencyUpdatedEvent,
  DependencyRemovedEvent,
} from "./EventIndex.js";
import {
  DependencyEventType,
  DependencyStatus,
  DependencyStatusType,
  DependencyErrorMessages,
} from "./Constants.js";
import { NAME_RULES } from "./rules/NameRules.js";
import { ECOSYSTEM_RULES } from "./rules/EcosystemRules.js";
import { PACKAGE_NAME_RULES } from "./rules/PackageNameRules.js";
import { VERSION_CONSTRAINT_RULES } from "./rules/VersionConstraintRules.js";
import { ENDPOINT_RULES } from "./rules/EndpointRules.js";
import { CONTRACT_RULES } from "./rules/ContractRules.js";
import { STATUS_RULES } from "./rules/StatusRules.js";

// Domain state: business properties + aggregate metadata
export interface DependencyState extends AggregateState {
  id: DependencyId;
  name: string;
  ecosystem: string;
  packageName: string;
  versionConstraint: string | null;
  endpoint: string | null;
  contract: string | null;
  status: DependencyStatusType;
  version: number;
}

export class Dependency extends BaseAggregate<
  DependencyState,
  DependencyEvent
> {
  private constructor(state: DependencyState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: DependencyState, event: DependencyEvent): void {
    switch (event.type) {
      case DependencyEventType.ADDED: {
        const e = event as DependencyAddedEvent;
        const upcasted = Dependency.upcastAddedPayload(e.payload);
        state.name = upcasted.name;
        state.ecosystem = upcasted.ecosystem;
        state.packageName = upcasted.packageName;
        state.versionConstraint = upcasted.versionConstraint;
        state.endpoint = e.payload.endpoint;
        state.contract = e.payload.contract;
        state.status = DependencyStatus.ACTIVE;
        state.version = e.version;
        break;
      }
      case DependencyEventType.UPDATED: {
        const e = event as DependencyUpdatedEvent;
        if (e.payload.endpoint !== undefined)
          state.endpoint = e.payload.endpoint;
        if (e.payload.contract !== undefined)
          state.contract = e.payload.contract;
        if (e.payload.status !== undefined) state.status = e.payload.status;
        state.version = e.version;
        break;
      }
      case DependencyEventType.REMOVED: {
        state.status = DependencyStatus.REMOVED;
        state.version = event.version;
        break;
      }
    }
  }

  static create(id: DependencyId = DependencyId.create()): Dependency {
    const state: DependencyState = {
      id,
      name: "",
      ecosystem: "",
      packageName: "",
      versionConstraint: null,
      endpoint: null,
      contract: null,
      status: DependencyStatus.ACTIVE,
      version: 0,
    };
    return new Dependency(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Dependency from event store.
   */
  static rehydrate(id: UUID, history: DependencyEvent[]): Dependency {
    const state: DependencyState = {
      id: DependencyId.fromLegacy(id),
      name: "",
      ecosystem: "",
      packageName: "",
      versionConstraint: null,
      endpoint: null,
      contract: null,
      status: DependencyStatus.ACTIVE,
      version: 0,
    };

    for (const event of history) {
      Dependency.apply(state, event);
    }

    return new Dependency(state);
  }

  add(
    name: string,
    ecosystem: string,
    packageName: string,
    versionConstraint?: string | null,
    endpoint?: string,
    contract?: string,
  ): DependencyAddedEvent {
    // Validation using rule pattern
    ValidationRuleSet.ensure(name, NAME_RULES);
    ValidationRuleSet.ensure(ecosystem, ECOSYSTEM_RULES);
    ValidationRuleSet.ensure(packageName, PACKAGE_NAME_RULES);
    if (versionConstraint)
      ValidationRuleSet.ensure(versionConstraint, VERSION_CONSTRAINT_RULES);
    if (endpoint) ValidationRuleSet.ensure(endpoint, ENDPOINT_RULES);
    if (contract) ValidationRuleSet.ensure(contract, CONTRACT_RULES);

    // Use BaseAggregate.makeEvent
    return this.makeEvent<DependencyAddedEvent>(
      DependencyEventType.ADDED,
      {
        name,
        ecosystem,
        packageName,
        versionConstraint: versionConstraint || null,
        endpoint: endpoint || null,
        contract: contract || null,
      },
      Dependency.apply,
    );
  }

  update(
    endpoint?: string | null,
    contract?: string | null,
    status?: DependencyStatusType,
  ): DependencyUpdatedEvent {
    // Validation for updated fields
    if (endpoint !== undefined && endpoint !== null) {
      ValidationRuleSet.ensure(endpoint, ENDPOINT_RULES);
    }
    if (contract !== undefined && contract !== null) {
      ValidationRuleSet.ensure(contract, CONTRACT_RULES);
    }
    if (status !== undefined) {
      ValidationRuleSet.ensure(status, STATUS_RULES);
    }

    return this.makeEvent<DependencyUpdatedEvent>(
      DependencyEventType.UPDATED,
      {
        endpoint: endpoint !== undefined ? endpoint : undefined,
        contract: contract !== undefined ? contract : undefined,
        status: status !== undefined ? status : undefined,
      },
      Dependency.apply,
    );
  }

  remove(reason?: string): DependencyRemovedEvent {
    // 1. State validation - can't remove if already removed
    if (this.state.status === DependencyStatus.REMOVED) {
      throw new Error(DependencyErrorMessages.ALREADY_REMOVED);
    }

    // 2. No additional input validation needed for optional reason
    // (Could add reason length validation if desired)

    // 3. Create and return event
    return this.makeEvent<DependencyRemovedEvent>(
      DependencyEventType.REMOVED,
      {
        reason: reason || null,
      },
      Dependency.apply,
    );
  }

  private static upcastAddedPayload(
    payload: ExternalDependencyPayload | LegacyComponentDependencyPayload,
  ): ExternalDependencyPayload {
    if (
      "name" in payload &&
      "ecosystem" in payload &&
      "packageName" in payload
    ) {
      return payload;
    }

    const legacyPayload = payload as LegacyComponentDependencyPayload;
    return {
      name: legacyPayload.providerId,
      ecosystem: "legacy-component",
      packageName: legacyPayload.providerId,
      versionConstraint: null,
      endpoint: legacyPayload.endpoint,
      contract: legacyPayload.contract,
    };
  }
}
