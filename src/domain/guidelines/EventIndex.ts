export * from "./add/GuidelineAddedEvent.js";
export * from "./update/GuidelineUpdatedEvent.js";
export * from "./remove/GuidelineRemovedEvent.js";

import { GuidelineAddedEvent } from "./add/GuidelineAddedEvent.js";
import { GuidelineUpdatedEvent } from "./update/GuidelineUpdatedEvent.js";
import { GuidelineRemovedEvent } from "./remove/GuidelineRemovedEvent.js";

// Union type of all guideline events
export type GuidelineEvent =
  GuidelineAddedEvent | GuidelineUpdatedEvent | GuidelineRemovedEvent;
