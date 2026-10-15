export type { DecisionAddedEvent } from "./add/DecisionAddedEvent.js";
export type { DecisionUpdatedEvent } from "./update/DecisionUpdatedEvent.js";
export type { DecisionReversedEvent } from "./reverse/DecisionReversedEvent.js";
export type { DecisionSupersededEvent } from "./supersede/DecisionSupersededEvent.js";
export type { DecisionRestoredEvent } from "./restore/DecisionRestoredEvent.js";
export type { DecisionRemovedEvent } from "./remove/DecisionRemovedEvent.js";

import { DecisionAddedEvent } from "./add/DecisionAddedEvent.js";
import { DecisionUpdatedEvent } from "./update/DecisionUpdatedEvent.js";
import { DecisionReversedEvent } from "./reverse/DecisionReversedEvent.js";
import { DecisionSupersededEvent } from "./supersede/DecisionSupersededEvent.js";
import { DecisionRestoredEvent } from "./restore/DecisionRestoredEvent.js";

import type { DecisionRemovedEvent } from "./remove/DecisionRemovedEvent.js";

// Union type of all decision events
export type DecisionEvent =
  | DecisionAddedEvent
  | DecisionUpdatedEvent
  | DecisionReversedEvent
  | DecisionSupersededEvent
  | DecisionRestoredEvent
  | DecisionRemovedEvent;
