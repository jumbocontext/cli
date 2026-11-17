import { ValuePropositionAddedEvent } from "./add/ValuePropositionAddedEvent.js";
import { ValuePropositionUpdatedEvent } from "./update/ValuePropositionUpdatedEvent.js";
import { ValuePropositionRemovedEvent } from "./remove/ValuePropositionRemovedEvent.js";
import { UUID } from "../BaseEvent.js";
import { ValuePropositionId } from "./ValuePropositionId.js";
import { AggregateState } from "../BaseAggregate.js";
import { ValuePropositionEventType } from "./Constants.js";

// Re-export ValuePropositionEvent type from here for convenience
export type ValuePropositionEvent =
  | ValuePropositionAddedEvent
  | ValuePropositionUpdatedEvent
  | ValuePropositionRemovedEvent;

// Domain state: business properties + aggregate metadata
export interface ValuePropositionState extends AggregateState {
  id: ValuePropositionId; // Aggregate identity
  title: string; // Required: short value description
  description: string; // Required: detailed explanation
  benefit: string; // Required: how this improves situation
  measurableOutcome: string | null; // Optional: how success is measured
  version: number; // Aggregate version for event sourcing
}

export class ValuePropositionProjection {
  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(
    state: ValuePropositionState,
    event: ValuePropositionEvent,
  ): void {
    switch (event.type) {
      case ValuePropositionEventType.ADDED: {
        const e = event as ValuePropositionAddedEvent;
        state.title = e.payload.title;
        state.description = e.payload.description;
        state.benefit = e.payload.benefit;
        state.measurableOutcome = e.payload.measurableOutcome;
        state.version = e.version;
        break;
      }
      case ValuePropositionEventType.UPDATED: {
        const e = event as ValuePropositionUpdatedEvent;
        if (e.payload.title !== undefined) state.title = e.payload.title;
        if (e.payload.description !== undefined)
          state.description = e.payload.description;
        if (e.payload.benefit !== undefined) state.benefit = e.payload.benefit;
        if (e.payload.measurableOutcome !== undefined)
          state.measurableOutcome = e.payload.measurableOutcome;
        state.version = e.version;
        break;
      }
      case ValuePropositionEventType.REMOVED: {
        // Mark as removed (version updated)
        state.version = event.version;
        break;
      }
    }
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used by Aggregate.rehydrate() to rebuild from event store.
   */
  static rehydrate(
    id: ValuePropositionId,
    history: ValuePropositionEvent[],
  ): ValuePropositionState {
    const state: ValuePropositionState = {
      id,
      title: "",
      description: "",
      benefit: "",
      measurableOutcome: null,
      version: 0,
    };

    for (const event of history) {
      this.apply(state, event);
    }

    return state;
  }
}
