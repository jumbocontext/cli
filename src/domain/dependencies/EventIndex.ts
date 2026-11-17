export * from "./add/DependencyAddedEvent.js";
export * from "./update/DependencyUpdatedEvent.js";
export * from "./remove/DependencyRemovedEvent.js";

import { DependencyAddedEvent } from "./add/DependencyAddedEvent.js";
import { DependencyUpdatedEvent } from "./update/DependencyUpdatedEvent.js";
import { DependencyRemovedEvent } from "./remove/DependencyRemovedEvent.js";

// Union type of all dependency events
export type DependencyEvent =
  DependencyAddedEvent | DependencyUpdatedEvent | DependencyRemovedEvent;
