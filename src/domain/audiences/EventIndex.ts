export * from "./add/AudienceAddedEvent.js";
export * from "./update/AudienceUpdatedEvent.js";
export * from "./remove/AudienceRemovedEvent.js";

import { AudienceAddedEvent } from "./add/AudienceAddedEvent.js";
import { AudienceUpdatedEvent } from "./update/AudienceUpdatedEvent.js";
import { AudienceRemovedEvent } from "./remove/AudienceRemovedEvent.js";

// Union type of all audience events
export type AudienceEvent =
  AudienceAddedEvent | AudienceUpdatedEvent | AudienceRemovedEvent;
