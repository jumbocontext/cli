/**
 * Base class for all domain aggregates.
 * Provides common functionality for event creation and state management.
 *
 * @template TState - The aggregate's state interface (must extend AggregateState)
 * @template TEvent - The aggregate's event union type (must extend BaseEvent)
 */

import { BaseEvent, UUID, ISO8601 } from "./BaseEvent.js";

/**
 * Minimum required properties for aggregate state.
 * All aggregate state interfaces must extend this.
 */
export interface AggregateState {
  readonly id: UUID;
  version: number;
}

/**
 * Base aggregate class that centralizes event creation and state management.
 * All domain aggregates should extend this class.
 *
 * Usage:
 * ```typescript
 * export class Project extends BaseAggregate<ProjectState, ProjectEvent> {
 *   private constructor(state: ProjectState) {
 *     super(state);
 *   }
 *
 *   initialize(...): ProjectInitialized {
 *     return this.makeEvent(
 *       ProjectEventType.INITIALIZED,
 *       { name, purpose, ... },
 *       ProjectProjection.apply
 *     );
 *   }
 * }
 * ```
 */
export abstract class BaseAggregate<
  TState extends AggregateState,
  TEvent extends BaseEvent,
> {
  protected state: TState;

  protected constructor(state: TState) {
    this.state = state;
  }

  /**
   * Creates a domain event and applies it to the aggregate's state.
   *
   * This method:
   * 1. Constructs the event with proper metadata (type, aggregateId, version, timestamp)
   * 2. Applies the event to the aggregate's state using the provided apply function
   * 3. Returns the event for persistence
   *
   * @param type - The event type (e.g., "ProjectInitialized")
   * @param payload - The event-specific payload data
   * @param applyFn - Function to apply the event to state (typically YourProjection.apply)
   * @returns The constructed event with all metadata
   *
   * @example
   * ```typescript
   * return this.makeEvent(
   *   ProjectEventType.INITIALIZED,
   *   { name: "MyProject", purpose: "Great project" },
   *   ProjectProjection.apply
   * );
   * ```
   */
  protected makeEvent<T extends TEvent>(
    type: string,
    payload: T extends { payload: infer P } ? P : never,
    applyFn: (state: TState, event: T) => void,
  ): T {
    const event = {
      type,
      aggregateId: this.state.id,
      version: this.state.version + 1,
      timestamp: new Date().toISOString() as ISO8601,
      payload,
    } as unknown as T;

    // Apply the event to mutate state in place
    applyFn(this.state, event);

    return event;
  }

  /**
   * Returns a shallow copy of the aggregate's current state.
   * Use this for testing or inspection - never mutate the returned object.
   *
   * @returns A shallow copy of the aggregate state
   */
  get snapshot(): Readonly<TState> {
    return { ...this.state };
  }
}
