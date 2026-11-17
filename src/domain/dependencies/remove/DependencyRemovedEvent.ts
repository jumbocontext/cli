/**
 * DependencyRemoved Event
 *
 * Emitted when a dependency is removed from the project.
 * The dependency status transitions to 'removed'.
 */

import { BaseEvent } from "../../BaseEvent.js";
import { DependencyEventType } from "../Constants.js";

export interface DependencyRemovedEvent extends BaseEvent {
  readonly type: typeof DependencyEventType.REMOVED;
  readonly payload: {
    readonly reason: string | null; // Optional: why it was removed
  };
}
