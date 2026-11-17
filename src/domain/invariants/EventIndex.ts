export * from "./add/InvariantAddedEvent.js";
export * from "./update/InvariantUpdatedEvent.js";
export * from "./remove/InvariantRemovedEvent.js";

import { InvariantAddedEvent } from "./add/InvariantAddedEvent.js";
import { InvariantUpdatedEvent } from "./update/InvariantUpdatedEvent.js";
import { InvariantRemovedEvent } from "./remove/InvariantRemovedEvent.js";

// Union type of all invariant events
export type InvariantEvent =
  InvariantAddedEvent | InvariantUpdatedEvent | InvariantRemovedEvent;
